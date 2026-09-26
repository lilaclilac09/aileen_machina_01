import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { clip, redactSecrets } from './redact';

/** Railway's SSH door. It creates a sandbox and returns connect lines. */
export const RAILWAY_SSH_TARGET = 'sandbox@railway.new';

const RAILWAY_PHRASE =
  /^(?:railway vm|open railway|ssh railway\.new|ssh sandbox@railway\.new)\s*$/i;

export function isRailwayVmPhrase(text: string): boolean {
  return RAILWAY_PHRASE.test(text.trim());
}

/** Dedicated key for this agent. Never commit it. Override with RAILWAY_SSH_IDENTITY. */
export function railwayIdentityPath(): string | null {
  const fromEnv = process.env.RAILWAY_SSH_IDENTITY?.trim();
  const path = fromEnv || join(homedir(), '.ssh', 'aileena_railway');
  return existsSync(path) ? path : null;
}

export function railwaySshArgs(): string[] {
  const identity = railwayIdentityPath();
  return [
    ...(identity ? ['-i', identity, '-o', 'IdentitiesOnly=yes'] : []),
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=12',
    '-o',
    'StrictHostKeyChecking=accept-new',
    RAILWAY_SSH_TARGET,
  ];
}

export type RailwayVmResult = {
  ok: boolean;
  summary: string;
  text: string;
};

export function readRailwaySshResult(text: string, code: number | null): RailwayVmResult {
  const body = text.trim();
  try {
    const parsed = JSON.parse(body) as { status?: string; human_signup_url?: string };
    if (parsed.status === 'signup_required' && parsed.human_signup_url) {
      return {
        ok: false,
        summary: `approve this key once: ${parsed.human_signup_url}`,
        text: body,
      };
    }
  } catch {
    /* Railway also returns plain connect lines after the key is approved. */
  }
  const needsKey = /approve|sign up|sign in|ssh-keygen|signup_required/i.test(body);
  return {
    ok: code === 0 && !needsKey && body.length > 0,
    summary: needsKey ? 'approve the SSH key once, then say railway vm again' : `ssh exit ${code ?? 'none'}`,
    text: body || `ssh exit ${code ?? 'none'}`,
  };
}

/**
 * Open the Railway sandbox over SSH. No host-shell stand-in.
 * The first connection from a new key returns an approve link instead of a VM.
 */
export function openRailwaySandbox(): Promise<RailwayVmResult> {
  return new Promise((resolve) => {
    const child = spawn('ssh', railwaySshArgs(), {
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: process.env.HOME ?? '',
      } as NodeJS.ProcessEnv,
      timeout: 20000,
    });
    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });
    child.on('error', (err) => {
      resolve({
        ok: false,
        summary: 'ssh client missing on this host',
        text: redactSecrets(err.message),
      });
    });
    child.on('close', (code) => {
      const text = redactSecrets(clip(out, 4000));
      resolve(readRailwaySshResult(text, code));
    });
  });
}
