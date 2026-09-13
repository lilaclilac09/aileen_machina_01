/** Honest catalog. Official names run on this workspace. */
export const OWNER_CLI_HELP = [
  'official surfaces on this workspace (same DO)',
  'demo · demo js · demo egress · demo mcp · demo rlm · demo think',
  'demo compare · demo tutorial · demo artifacts · demo assets',
  'demo container — computerd Linux on the same workspace',
  'container <cmd> — owner Linux (uname, node, npm, git, …)',
  'js <module> — ad-hoc worker-javascript',
  'builtins: cd  put|write  clear  help  examples  vcode',
  'bins: ls cat pwd mkdir find tree curl jq file xan html-to-markdown echo grep sed awk',
  'voice: say demo js · say demo container · say write code greet.ts',
].join('\n');

export const OWNER_CLI_EXAMPLES = [
  'type the official name. it runs if this isolate can.',
  '',
  'yes:',
  '  demo            examples/worker-shell     PUT + jq',
  '  demo js         examples/worker-javascript ESM on LOADER',
  '  demo egress     examples/egress           shell direct + js direct + js none',
  '  demo mcp        examples/mcp              in-process computer.exec/read',
  '  demo rlm        examples/rlm              JS reduce of a workspace file',
  '  demo think      examples/think            workspace as cwd (not @cloudflare/think pkg)',
  '  demo compare    examples/think-compare    same file · shell vs js',
  '  demo tutorial   examples/tutorial         recipe.md + tiny PDF (not pandoc)',
  '  demo artifacts  examples/artifacts        Worker scaffold (publish needs ARTIFACTS)',
  '  demo assets     examples/assets           SVG file (share needs R2)',
  '  demo container  examples/container        computerd Linux · same workspace',
  '  container uname -a                        Linux on the bound container',
  '',
  'packages/dofs · rpc · computerd · computer are internals, not extra terminals.',
].join('\n');
