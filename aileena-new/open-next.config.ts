import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Incremental cache R2 binding is optional. Do not reuse bucket aileena09062026
// (that holds source backups / the old zip).
export default defineCloudflareConfig({});
