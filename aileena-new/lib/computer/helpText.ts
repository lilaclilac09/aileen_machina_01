/** Honest worker-shell help. Do not list container / js-exec / pnpm as available. */
export const OWNER_CLI_HELP = [
  'worker-shell · just-bash · not Linux',
  'builtins: cd  put|write  clear  help  examples  vcode',
  'bins: ls cat pwd mkdir find tree curl jq file xan html-to-markdown echo grep sed awk',
  'voice: say ls · say go to scratch · say write code greet.ts',
  'vcode writes under scratch/reports/artifacts only',
  'type examples — official catalog vs this shell',
  'not here: container/computerd · worker-javascript · pnpm · node · vim · git write',
].join('\n');

/** Why official examples/ do not appear as extra terminals. */
export const OWNER_CLI_EXAMPLES = [
  'official cloudflare/computer examples vs this terminal',
  '',
  'you have: examples/worker-shell',
  '  just-bash in a Dynamic Worker. ls cat curl jq put vcode',
  '',
  'not bound (so they will not appear here):',
  '  examples/container — computerd + Linux FUSE',
  '  examples/worker-javascript — ESM eval, not a shell',
  '  examples/think — @cloudflare/think agent cwd',
  '  examples/artifacts — publish a Worker project',
  '  examples/assets — Workers AI image + share link',
  '  examples/rlm — JS reducing long context',
  '  examples/tutorial — pandoc/PDF on a Linux host',
  '',
  'partial:',
  '  examples/mcp — in-process computer + github (https only)',
  '  examples/egress — curl uses direct egress; no policy playground',
  '',
  'binding those would be a second computer. this one stays worker-shell.',
].join('\n');
