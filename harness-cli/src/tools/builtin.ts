import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';
import type { ToolDefinition } from '../core/types.ts';
import { runCodeMode } from './codeMode.ts';
import { applyPatchTool } from './applyPatch.ts';

const MAX_READ = 80_000;
const MAX_GREP_HITS = 40;

function safePath(cwd: string, p: string): string {
  const abs = resolve(cwd, p);
  const rel = relative(cwd, abs);
  // Reject paths that escape cwd (absolute rel on Windows, or .. prefix).
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`path escapes cwd: ${p}`);
  }
  return abs;
}

export const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    name: 'list_dir',
    description: 'List files in a directory under cwd.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative directory' } },
      required: ['path'],
    },
    async execute(args, ctx) {
      const dir = safePath(ctx.cwd, String(args.path ?? '.'));
      const entries = readdirSync(dir, { withFileTypes: true })
        .slice(0, 200)
        .map((e) => `${e.isDirectory() ? 'd' : 'f'} ${e.name}`);
      return entries.join('\n') || '(empty)';
    },
  },
  {
    name: 'read_file',
    description: 'Read a UTF-8 text file under cwd (bounded).',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
    async execute(args, ctx) {
      const file = safePath(ctx.cwd, String(args.path));
      const text = readFileSync(file, 'utf8');
      if (text.length > MAX_READ) return text.slice(0, MAX_READ) + '\n…[truncated]';
      return text;
    },
  },
  {
    name: 'grep',
    description: 'Substring search across text files under a root path.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        path: { type: 'string', description: 'Root relative path' },
      },
      required: ['query'],
    },
    async execute(args, ctx) {
      const query = String(args.query ?? '');
      if (!query) throw new Error('query required');
      const root = safePath(ctx.cwd, String(args.path ?? '.'));
      const hits: string[] = [];

      const walk = (dir: string) => {
        if (hits.length >= MAX_GREP_HITS) return;
        let entries;
        try {
          entries = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          if (hits.length >= MAX_GREP_HITS) break;
          if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
          const full = join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.isFile()) {
            let st;
            try {
              st = statSync(full);
            } catch {
              continue;
            }
            if (st.size > 400_000) continue;
            let text: string;
            try {
              text = readFileSync(full, 'utf8');
            } catch {
              continue;
            }
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(query)) {
                hits.push(`${relative(ctx.cwd, full)}:${i + 1}:${lines[i].trim()}`);
                if (hits.length >= MAX_GREP_HITS) break;
              }
            }
          }
        }
      };

      if (existsSync(root) && statSync(root).isFile()) {
        const text = readFileSync(root, 'utf8');
        text.split('\n').forEach((line, i) => {
          if (line.includes(query) && hits.length < MAX_GREP_HITS) {
            hits.push(`${relative(ctx.cwd, root)}:${i + 1}:${line.trim()}`);
          }
        });
      } else {
        walk(root);
      }
      return hits.join('\n') || '(no hits)';
    },
  },
  {
    name: 'write_file',
    description: 'Write a UTF-8 file under cwd (requires --write).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
    async execute(args, ctx) {
      const file = safePath(ctx.cwd, String(args.path));
      writeFileSync(file, String(args.content ?? ''), 'utf8');
      return `wrote ${relative(ctx.cwd, file)}`;
    },
  },
  applyPatchTool,
  {
    name: 'shell',
    description: 'Run a bounded shell command in cwd (requires --shell).',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string' },
      },
      required: ['command'],
    },
    async execute(args, ctx) {
      const command = String(args.command ?? '');
      if (!command) throw new Error('command required');
      return await new Promise<string>((resolvePromise, reject) => {
        const child = spawn('bash', ['-lc', command], {
          cwd: ctx.cwd,
          signal: ctx.signal,
          env: process.env,
        });
        let out = '';
        let err = '';
        child.stdout.on('data', (d) => {
          out += d;
          if (out.length > 40_000) out = out.slice(0, 40_000) + '\n…[truncated]';
        });
        child.stderr.on('data', (d) => {
          err += d;
          if (err.length > 20_000) err = err.slice(0, 20_000) + '\n…[truncated]';
        });
        child.on('error', reject);
        child.on('close', (code) => {
          resolvePromise(`exit ${code}\n${out}${err ? `\nSTDERR:\n${err}` : ''}`.trim());
        });
      });
    },
  },
  {
    name: 'code_mode',
    description:
      'Run a JS cell that can call tools.<name>(args). Compose multiple tools without extra model round-trips.',
    parameters: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Async JS body. Use tools.list_dir / tools.read_file / …; return or text(value).',
        },
      },
      required: ['source'],
    },
    async execute(args, ctx) {
      return runCodeMode(String(args.source ?? ''), ctx);
    },
  },
];
