/** Immediate owner reply: bolt + one human sentence. Never silence after queue. */

const DOING: Record<string, string> = {
  draft_daily_fix_plan: 'Inspecting /daily and drafting a plan',
  write_scratch_file: 'Writing a scratch file in the workspace',
  inspect_route_files: 'Inspecting route files',
  generate_implementation_prompt: 'Preparing an implementation prompt / PR summary',
  draft_patch: 'Drafting a patch plan (not applying it)',
  run_build_check: 'Running an allowlisted check',
  collect_screenshot_checklist: 'Collecting a screenshot checklist',
  update_proof_queue: 'Updating the proof queue',
  git_status: 'Reading git status',
  git_log: 'Reading recent commits',
  git_find_commit: 'Finding commit candidates',
  git_show: 'Showing a commit',
  files_tree: 'Listing files',
  files_search: 'Searching files',
  files_open: 'Opening a file read-only',
  email_draft: 'Drafting email (not sending)',
  email_send: 'Email send is blocked until owner confirms',
  browser_screenshot: 'Browser automation is blocked',
};

export function spokenQueued(opts: {
  taskType: string;
  route: string;
  proofItemId: string;
  proofTitle?: string;
}): string {
  const doing = DOING[opts.taskType] || `Running ${opts.taskType}`;
  const hung = opts.proofTitle
    ? `${opts.proofItemId} (${opts.proofTitle})`
    : opts.proofItemId;
  return `⚡ queued. ${doing} for ${opts.route}. Hung on proof ${hung}. Computer stays in this dialog. I can still talk. No merge.`;
}
