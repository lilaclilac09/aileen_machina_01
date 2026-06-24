/**
 * Magazine-issue registry. Every interactive research issue exports a
 * MagazineIssue from its own file under lib/research/<slug>.ts; this
 * file is the single source of truth for which issues are on the
 * cover wall and in what order.
 *
 * Order is editorial — newest issue first, since the cover wall is the
 * newsstand for the magazine, not an archive.
 */

import { HUAWEI_HBM } from './huawei-hbm';
import type { MagazineIssue } from './huawei-hbm';

export const ALL_ISSUES: MagazineIssue[] = [HUAWEI_HBM];
