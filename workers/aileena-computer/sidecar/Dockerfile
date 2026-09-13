FROM alpine:3.21
RUN apk add --no-cache python3 iptables openssl
COPY proxy.py /usr/local/bin/proxy.py
ENTRYPOINT ["python3", "/usr/local/bin/proxy.py"]
