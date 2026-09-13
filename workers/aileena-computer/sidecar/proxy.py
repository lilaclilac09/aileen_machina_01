#!/usr/bin/env python3
"""Wrangler-dev egress sidecar using NAT REDIRECT instead of TPROXY."""
from __future__ import annotations

import argparse
import json
import os
import socket
import struct
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Tuple
from urllib.parse import urlsplit

SO_ORIGINAL_DST = 80
SOL_IP = getattr(socket, "SOL_IP", 0)
LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 41209
EGRESS_HOST = "11.0.0.1"


def log(msg: str) -> None:
    print(msg, flush=True)


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def lookup_gateway(override: str, cidr: str) -> str:
    if override:
        return override
    try:
        return socket.getaddrinfo("host.docker.internal", None, socket.AF_INET)[0][4][0]
    except OSError:
        pass
    if "/" in cidr:
        parts = cidr.split("/", 1)[0].split(".")
        if len(parts) == 4:
            parts[3] = "1"
            return ".".join(parts)
    return "172.17.0.1"


def original_dst(conn: socket.socket) -> Tuple[str, int]:
    data = conn.getsockopt(SOL_IP, SO_ORIGINAL_DST, 16)
    port = struct.unpack("!H", data[2:4])[0]
    ip = socket.inet_ntoa(data[4:8])
    return ip, port


def apply_redirect(cidr: str, gateway: str) -> None:
    chain = "AILEENA_REDIR"
    subprocess.call(["iptables", "-t", "nat", "-D", "OUTPUT", "-p", "tcp", "-j", chain], stderr=subprocess.DEVNULL)
    subprocess.call(["iptables", "-t", "nat", "-F", chain], stderr=subprocess.DEVNULL)
    subprocess.call(["iptables", "-t", "nat", "-X", chain], stderr=subprocess.DEVNULL)
    run(["iptables", "-t", "nat", "-N", chain])
    run(["iptables", "-t", "nat", "-A", chain, "-d", "127.0.0.0/8", "-j", "RETURN"])
    run(["iptables", "-t", "nat", "-A", chain, "-d", cidr, "-j", "RETURN"])
    run(["iptables", "-t", "nat", "-A", chain, "-d", f"{gateway}/32", "-j", "RETURN"])
    run(["iptables", "-t", "nat", "-A", chain, "-p", "tcp", "-j", "REDIRECT", "--to-ports", str(LISTEN_PORT)])
    run(["iptables", "-t", "nat", "-A", "OUTPUT", "-p", "tcp", "-j", chain])


class EgressState:
    def __init__(self, port: int, gateway: str) -> None:
        self.port = port
        self.gateway = gateway
        self.lock = threading.Lock()

    def set_port(self, port: int) -> None:
        with self.lock:
            self.port = port


def peek_client(conn: socket.socket) -> Tuple[bytes, str, str]:
    conn.settimeout(0.5)
    buf = b""
    try:
        while len(buf) < 16384:
            chunk = conn.recv(4096)
            if not chunk:
                break
            buf += chunk
            if buf[:1] == b"\x16":
                break
            if b"\r\n\r\n" in buf:
                break
    except TimeoutError:
        pass
    except socket.timeout:
        pass
    conn.settimeout(None)
    sni = ""
    hostname = ""
    if buf.startswith(b"\x16\x03"):
        sni = parse_sni(buf)
    else:
        for line in buf.split(b"\r\n"):
            if line.lower().startswith(b"host:"):
                raw = line.split(b":", 1)[1].decode("latin1").strip()
                hostname = raw.split(":")[0].strip()
                break
    return buf, sni, hostname


def parse_sni(record: bytes) -> str:
    try:
        if len(record) < 43:
            return ""
        session_len = record[43]
        pos = 44 + session_len
        cipher_len = int.from_bytes(record[pos : pos + 2], "big")
        pos += 2 + cipher_len
        comp_len = record[pos]
        pos += 1 + comp_len
        ext_len = int.from_bytes(record[pos : pos + 2], "big")
        pos += 2
        end = pos + ext_len
        while pos + 4 <= end and pos + 4 <= len(record):
            ext_type = int.from_bytes(record[pos : pos + 2], "big")
            length = int.from_bytes(record[pos + 2 : pos + 4], "big")
            pos += 4
            if ext_type == 0 and pos + 5 <= len(record):
                name_len = int.from_bytes(record[pos + 3 : pos + 5], "big")
                return record[pos + 5 : pos + 5 + name_len].decode("ascii")
            pos += length
    except Exception:
        return ""
    return ""


def connect_gateway(
    state: EgressState,
    dest: str,
    source: str,
    sni: str = "",
    hostname: str = "",
) -> Tuple[socket.socket, bytes]:
    with state.lock:
        gateway = (state.gateway, state.port)
    upstream = socket.create_connection(gateway, timeout=8)
    extra = ""
    if sni:
        extra += f"X-Tls-Sni: {sni}\r\n"
    if hostname:
        extra += f"X-Hostname: {hostname}\r\n"
    req = (
        f"CONNECT {dest} HTTP/1.1\r\n"
        f"Host: {dest}\r\n"
        f"User-Agent: proxy-everything/0.0.1/{source}\r\n"
        "Connection: close\r\n"
        f"X-Forwarded-For: {source}\r\n"
        "X-Proto: tcp\r\n"
        f"{extra}"
        "\r\n"
    )
    upstream.sendall(req.encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        chunk = upstream.recv(4096)
        if not chunk:
            raise OSError("gateway closed")
        buf += chunk
    status = buf.split(b"\r\n", 1)[0]
    if b" 200 " not in status and b" 202 " not in status:
        raise OSError(f"gateway {status!r}")
    leftover = buf.split(b"\r\n\r\n", 1)[1]
    return upstream, leftover


def pipe(a: socket.socket, b: socket.socket) -> None:
    try:
        while True:
            data = a.recv(65536)
            if not data:
                break
            b.sendall(data)
    except OSError:
        pass
    try:
        b.shutdown(socket.SHUT_WR)
    except OSError:
        pass


def handle_redirect(conn: socket.socket, addr: Tuple[str, int], state: EgressState) -> None:
    try:
        dest_ip, dest_port = original_dst(conn)
        dest = f"{dest_ip}:{dest_port}"
        peeked, sni, hostname = peek_client(conn)
        if dest_ip == EGRESS_HOST and not hostname:
            hostname = "computer.internal"
        log(f"redirect {addr[0]} → {dest} host={hostname!r} sni={sni!r} peek={len(peeked)}")
        upstream, leftover = connect_gateway(state, dest, addr[0], sni=sni, hostname=hostname)
        if leftover:
            conn.sendall(leftover)
        if peeked:
            upstream.sendall(peeked)
        t = threading.Thread(target=pipe, args=(upstream, conn), daemon=True)
        t.start()
        pipe(conn, upstream)
        t.join()
    except Exception as err:
        log(f"redirect error: {err}")
    finally:
        try:
            conn.close()
        except OSError:
            pass


def serve_redirect(state: EgressState) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((LISTEN_HOST, LISTEN_PORT))
    sock.listen(128)
    log(f"Redirect listener {LISTEN_HOST}:{LISTEN_PORT}")
    while True:
        conn, addr = sock.accept()
        threading.Thread(target=handle_redirect, args=(conn, addr, state), daemon=True).start()


def parse_hostport(dest: str) -> Tuple[str, int]:
    dest = dest.strip()
    if dest.startswith("["):
        host, port = dest.rsplit("]:", 1)
        return host[1:], int(port)
    host, port = dest.rsplit(":", 1)
    return host, int(port)


def ensure_ca() -> None:
    os.makedirs("/ca", exist_ok=True)
    if os.path.exists("/ca/ca.crt") and os.path.exists("/ca/ca.key"):
        return
    subprocess.check_call(
        [
            "openssl",
            "req",
            "-x509",
            "-newkey",
            "ec",
            "-pkeyopt",
            "ec_paramgen_curve:prime256v1",
            "-days",
            "3650",
            "-nodes",
            "-keyout",
            "/ca/ca.key",
            "-out",
            "/ca/ca.crt",
            "-subj",
            "/CN=aileena-redirect-proxy",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    log("TLS interception CA written to /ca/ca.crt")


class IngressHandler(BaseHTTPRequestHandler):
    state: EgressState

    def log_message(self, fmt: str, *args: object) -> None:
        log("ingress: " + fmt % args)

    def send_empty(self, code: int) -> None:
        self.send_response(code)
        self.end_headers()

    def do_PUT(self) -> None:  # noqa: N802
        if urlsplit(self.path).path != "/egress":
            self.send_empty(404)
            return
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode() or "{}")
        except json.JSONDecodeError:
            self.send_empty(400)
            return
        port = payload.get("port")
        if port is not None:
            self.state.set_port(int(port))
            log(f"updated shared egress port to {port}")
        self.send_empty(204)

    def do_GET(self) -> None:  # noqa: N802
        if urlsplit(self.path).path != "/ca":
            self.send_empty(404)
            return
        if not os.path.exists("/ca/ca.crt"):
            self.send_empty(404)
            return
        body = open("/ca/ca.crt", "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", "application/x-pem-file")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self) -> None:  # noqa: N802
        self.do_GET()

    def do_CONNECT(self) -> None:  # noqa: N802
        dest = self.headers.get("X-Dst-Addr") or self.path
        try:
            host, port = parse_hostport(dest)
            origin = socket.create_connection((host, port), timeout=8)
        except Exception as err:
            log(f"ingress CONNECT {dest!r} failed: {err}")
            self.send_empty(400)
            return
        self.send_response(200)
        self.end_headers()
        t = threading.Thread(target=pipe, args=(origin, self.connection), daemon=True)
        t.start()
        pipe(self.connection, origin)
        t.join()


def serve_ingress(address: str, state: EgressState) -> None:
    host, port_s = address.rsplit(":", 1)
    handler = type("H", (IngressHandler,), {"state": state})
    httpd = ThreadingHTTPServer((host, int(port_s)), handler)
    log(f"Ingress listener accepting CONNECT on {address}")
    httpd.serve_forever()


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(add_help=False)
    p.add_argument("--http-egress-port", type=int, default=49121)
    p.add_argument("--http-ingress-address", default="")
    p.add_argument("--docker-gateway-cidr", default="172.17.0.0/16")
    p.add_argument("--gateway-ip", default="")
    p.add_argument("--address", default="127.0.0.3:41209")
    p.add_argument("--address-v6", default="")
    p.add_argument("--disable-ipv6", action="store_true")
    p.add_argument("--tls-intercept", action="store_true")
    p.add_argument("--dns-enabled", action="store_true")
    p.add_argument("--dns-address", default="")
    p.add_argument("--dns-address-v6", default="")
    args, _unknown = p.parse_known_args()
    return args


def main() -> int:
    args = parse_args()
    gateway = lookup_gateway(args.gateway_ip, args.docker_gateway_cidr)
    state = EgressState(args.http_egress_port, gateway)
    log(f"Proxy address: {LISTEN_HOST}, Port: {LISTEN_PORT} gateway={gateway}:{args.http_egress_port}")
    try:
        ensure_ca()
    except Exception as err:
        log(f"ca skip: {err}")
    threading.Thread(target=serve_redirect, args=(state,), daemon=True).start()
    if args.http_ingress_address:
        threading.Thread(target=serve_ingress, args=(args.http_ingress_address, state), daemon=True).start()
    apply_redirect(args.docker_gateway_cidr, gateway)
    try:
        if os.path.exists("/etc/hosts"):
            hosts = open("/etc/hosts", encoding="utf-8").read()
            if "computer.internal" not in hosts:
                with open("/etc/hosts", "a", encoding="utf-8") as fh:
                    fh.write(f"{EGRESS_HOST} computer.internal\n")
    except OSError as err:
        log(f"hosts skip: {err}")
    threading.Event().wait()
    return 0


if __name__ == "__main__":
    sys.exit(main())
