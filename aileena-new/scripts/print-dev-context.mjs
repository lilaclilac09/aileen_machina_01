#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function git(args) {
  return execFileSync("git", args, {
    cwd: appRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

let sha = "no-git";
let top = "n/a";
try {
  top = git(["rev-parse", "--show-toplevel"]);
  sha = git(["rev-parse", "--short", "HEAD"]);
} catch {
  // unzipped zip has no git
}

console.log(`[aileena-new] ${appRoot}`);
console.log(`[aileena-new] git ${top} @ ${sha}`);
if (sha === "no-git") {
  console.warn(
    "[aileena-new] WARNING: not a git checkout. Stop. Use the clone …/aileen_machina_01/aileena-new, not an unzipped zip.",
  );
}
