"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface Credit {
  id: string;
  code: string;
  link: string;
  isUsed: boolean;
  isTest: boolean;
  assignedAt: string | null;
  createdAt: string;
}

interface EligibleUser {
  id: string;
  email: string;
  name: string;
  company: string | null;
  approvalStatus: string;
  isVolunteer: boolean;
  hasClaimed: boolean;
  claimedAt: string | null;
  claimCount: number;
  credit: Credit | null;
}

interface Stats {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  testCredits: number;
  realCredits: number;
  totalEligible: number;
  claimedUsers: number;
  approvedUsers: number;
  pendingUsers: number;
}

interface DashboardData {
  stats: Stats;
  credits: Credit[];
  eligibleUsers: EligibleUser[];
}

/**
 * Admin dashboard — English UI. Name is not shown (not audited).
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "credits">("users");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const lumaCsvInputRef = useRef<HTMLInputElement>(null);
  const lumaImportModeRef = useRef<"all-approved" | "checked-in">("all-approved");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const executeAction = async (action: string, actionData: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data: actionData }),
      });
      const json = await res.json();
      if (json.error) {
        alert(`Error: ${json.error}`);
      } else {
        alert(json.message || "Action completed");
        fetchDashboard();
      }
    } catch (err) {
      alert("Failed to run action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCredit = async (email: string, useTest: boolean = false) => {
    if (confirm(`Assign ${useTest ? "TEST" : "real"} credit to ${email}?`)) {
      await executeAction("ASSIGN_CREDIT", { email, useTestCredit: useTest });
    }
  };

  const handleRevokeCredit = async (userId: string, email: string) => {
    if (confirm(`Revoke credit from ${email}? The credit will become available again.`)) {
      await executeAction("REVOKE_CREDIT", { userId });
    }
  };

  const handleDeleteUser = async (userId: string, email: string, hasClaimed: boolean) => {
    const msg = hasClaimed
      ? `Delete ${email}?\n\nThey already claimed a credit — it will be returned to the pool, then the user row is removed.`
      : `Delete ${email} from the guest list?`;
    if (!confirm(msg)) return;
    if (!confirm(`Final confirm: permanently delete ${email}?`)) return;
    await executeAction("DELETE_ELIGIBLE_USER", { userId });
  };

  const handleToggleVolunteer = async (
    userId: string,
    email: string,
    isVolunteer: boolean
  ) => {
    const next = !isVolunteer;
    if (
      !confirm(
        next
          ? `将 ${email} 标记为特殊用户？\n\n特殊用户同一邮箱最多可领 6 份 credits（VOLUNTEER_MAX_CLAIMS）。\n\nMark as special user? Up to 6 credits per email.`
          : `取消 ${email} 的特殊用户标记？\n\n之后同一邮箱只能领 1 份。\n\nUnmark special user? Limit returns to 1 credit.`
      )
    ) {
      return;
    }
    await executeAction("TOGGLE_VOLUNTEER", { userId, isVolunteer: next });
  };

  const handleDownloadUnclaimedEmails = () => {
    const rows = (data?.eligibleUsers || [])
      .filter(
        (u) =>
          !u.hasClaimed &&
          u.approvalStatus === "approved" &&
          u.email.includes("@")
      )
      .slice()
      .sort((a, b) => a.email.localeCompare(b.email));

    if (rows.length === 0) {
      alert("No unclaimed approved emails to download.");
      return;
    }

    // Deduplicate by email (keep first)
    const seen = new Set<string>();
    const unique = rows.filter((u) => {
      const key = u.email.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const emails = unique.map((u) => u.email.trim().toLowerCase());
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    const csv =
      "email,name,company,status\n" +
      unique
        .map((u) => {
          const email = u.email.trim().toLowerCase();
          const name = JSON.stringify(u.name || "");
          const company = JSON.stringify(u.company || "");
          return `${email},${name},${company},unclaimed`;
        })
        .join("\n") +
      "\n";

    const download = (filename: string, content: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    download(
      `unclaimed-emails-${stamp}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
    download(
      `unclaimed-emails-bcc-${stamp}.txt`,
      emails.join(", ") + "\n",
      "text/plain;charset=utf-8"
    );
    alert(
      `Downloaded ${emails.length} unclaimed emails (CSV + BCC list).\n\n` +
        `Stats: pending≈${data?.stats.pendingUsers ?? "?"}, claimed=${data?.stats.claimedUsers ?? "?"}.\n\n` +
        `Paste BCC list into Apple Mail / Gmail in batches of ~30–40.`
    );
  };

  const handleSendEmail = async (userId: string, email: string) => {
    const locale = confirm(
      `Email language?\n\nOK = Chinese\nCancel = English`
    )
      ? "zh"
      : "en";
    await executeAction("SEND_CREDIT_EMAIL", { userId, locale });
  };

  const handleSyncSheet = async () => {
    if (
      !confirm(
        "Clear + Sync Sheet (credits)\n\nMUST run in this order every time:\n\n1) CLEAR cache — delete ALL unused credits\n2) SYNC — import referral links from Google Sheet\n\nAlready-used credits are kept.\n\nOK to Clear then Sync."
      )
    ) {
      return;
    }
    await executeAction("SYNC_CREDITS_FROM_SHEET", {});
  };

  const handleImportLumaCsvClick = () => {
    lumaCsvInputRef.current?.click();
  };

  const handleImportLumaCsvFile = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const csvText = await file.text();
    const mode = lumaImportModeRef.current;
    lumaImportModeRef.current = "all-approved";

    if (mode === "checked-in") {
      if (
        !confirm(
          "Clear + Sync Checked-in\n\nMUST run in this order every time:\n\n1) CLEAR cache — delete ALL unclaimed guests\n2) SYNC — import ONLY checked_in_at rows from this CSV\n\nAlready-claimed users are kept.\n\nOK to Clear then Sync."
        )
      ) {
        return;
      }
      await executeAction("SYNC_CHECKED_IN_ALLOWLIST", { csvText });
      return;
    }

    const onlyCheckedIn = confirm(
      "Import only (NO clear)?\n\nThis does NOT clear the old list.\nFor door day use Clear + Sync Checked-in instead.\n\nOK = import checked-in only (additive)\nCancel = import all approved (additive)"
    );

    await executeAction("IMPORT_LUMA_CSV", {
      csvText,
      onlyApproved: true,
      onlyCheckedIn,
      revokeOthers: false,
    });
  };

  const handleSyncCheckedInClick = () => {
    lumaImportModeRef.current = "checked-in";
    lumaCsvInputRef.current?.click();
  };

  const handleClearGuestList = async () => {
    if (
      !confirm(
        "Delete guest list?\n\n• Deletes all users who have NOT claimed yet\n• Keeps users who already claimed (and their credit links)\n\nYou can re-import with Sync Checked-in afterwards.\n\nOK to delete."
      )
    ) {
      return;
    }
    if (
      !confirm(
        "Final confirm: permanently delete unclaimed eligible users from the database?"
      )
    ) {
      return;
    }
    await executeAction("CLEAR_GUEST_LIST", { keepClaimed: true });
  };

  const handleSyncLumaApi = async () => {
    if (
      !confirm(
        "Sync via Luma API?\n\nAlso clears unclaimed guest cache first, then syncs checked-in.\nRequires Luma Plus.\n\nWithout Plus, use Clear + Sync Checked-in (CSV)."
      )
    ) {
      return;
    }
    await executeAction("SYNC_LUMA_CHECKED_IN", {});
  };

  const filteredUsers = data?.eligibleUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCredits = data?.credits.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.link.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-grid-pattern opacity-20" />

      <header className="relative border-b border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 466.73 532.09"
              fill="currentColor"
            >
              <path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39Z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold">Cafe Cursor Admin</h1>
              <p className="text-xs text-gray-400">Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/host"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              QR Host Kit
            </a>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Sync rule（名单 & 学分：每次必须先清）</p>
          <p className="mt-1 text-amber-200/90">
            Every sync <strong>must clear unused/unclaimed cache first</strong>, then
            import.{" "}
            <strong>Clear + Sync Sheet</strong> = credits；
            <strong> Clear + Sync Checked-in</strong> = guest list. Used / claimed rows
            are kept. <strong>Import Luma CSV</strong> alone does not clear (additive).
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <StatCard
            label="Total Credits"
            value={data?.stats.totalCredits || 0}
            color="blue"
          />
          <StatCard
            label="Available"
            value={data?.stats.availableCredits || 0}
            color="green"
          />
          <StatCard
            label="Used"
            value={data?.stats.usedCredits || 0}
            color="orange"
          />
          <StatCard
            label="Test"
            value={data?.stats.testCredits || 0}
            color="purple"
          />
          <StatCard
            label="Eligible Users"
            value={data?.stats.approvedUsers || 0}
            color="cyan"
          />
          <StatCard
            label="Claimed"
            value={data?.stats.claimedUsers || 0}
            color="pink"
          />
          <StatCard
            label="Unclaimed"
            value={data?.stats.pendingUsers || 0}
            color="yellow"
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-white text-black"
                  : "border border-gray-700 hover:bg-gray-800"
              }`}
            >
              Users ({data?.stats.totalEligible ?? data?.eligibleUsers.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("credits")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "credits"
                  ? "bg-white text-black"
                  : "border border-gray-700 hover:bg-gray-800"
              }`}
            >
              Credits ({data?.stats.totalCredits ?? 0})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder:text-gray-500 focus:border-white focus:outline-none"
            />
            <input
              ref={lumaCsvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportLumaCsvFile}
            />
            <button
              onClick={handleDownloadUnclaimedEmails}
              disabled={actionLoading || !data}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
              title="Download approved but unclaimed emails (CSV + BCC)"
            >
              Unclaimed
              {data?.stats.pendingUsers != null
                ? ` (${data.stats.pendingUsers})`
                : ""}
            </button>
            <select
              disabled={actionLoading}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = "";
                if (!v) return;
                if (v === "add-user") setShowAddUserModal(true);
                else if (v === "add-credit") setShowAddCreditModal(true);
                else if (v === "sync-sheet") handleSyncSheet();
                else if (v === "sync-checked-in") handleSyncCheckedInClick();
                else if (v === "clear-list") handleClearGuestList();
                else if (v === "import-luma") handleImportLumaCsvClick();
                else if (v === "sync-luma-api") handleSyncLumaApi();
              }}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-white focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>
                Tools…
              </option>
              <optgroup label="Add">
                <option value="add-user">+ User</option>
                <option value="add-credit">+ Credit</option>
              </optgroup>
              <optgroup label="Sync">
                <option value="sync-sheet">Clear + Sync Sheet</option>
                <option value="sync-checked-in">Clear + Sync Checked-in</option>
                <option value="import-luma">Import Luma CSV</option>
                <option value="sync-luma-api">Sync Luma API</option>
              </optgroup>
              <optgroup label="Danger">
                <option value="clear-list">Clear list</option>
              </optgroup>
            </select>
            <button
              onClick={fetchDashboard}
              disabled={actionLoading}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {activeTab === "users" && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Credit</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{user.email}</span>
                        {user.isVolunteer && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-300">
                            特殊用户
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{user.company || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.approvalStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {user.hasClaimed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                          ✓ {user.credit?.code}
                          {user.claimCount > 1 ? ` ×${user.claimCount}` : ""}
                          {user.credit?.isTest && " (TEST)"}
                        </span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={actionLoading}
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (!v) return;
                          if (v === "assign") handleAssignCredit(user.email, false);
                          else if (v === "test") handleAssignCredit(user.email, true);
                          else if (v === "email") handleSendEmail(user.id, user.email);
                          else if (v === "revoke") handleRevokeCredit(user.id, user.email);
                          else if (v === "special")
                            handleToggleVolunteer(
                              user.id,
                              user.email,
                              user.isVolunteer
                            );
                          else if (v === "delete")
                            handleDeleteUser(user.id, user.email, user.hasClaimed);
                        }}
                        className="max-w-[10rem] rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs focus:border-white focus:outline-none disabled:opacity-50"
                      >
                        <option value="" disabled>
                          操作…
                        </option>
                        {(!user.hasClaimed || user.isVolunteer) &&
                          user.approvalStatus === "approved" && (
                            <optgroup label="Assign">
                              <option value="assign">Assign credit</option>
                              <option value="test">Assign test</option>
                            </optgroup>
                          )}
                        {user.hasClaimed && (
                          <optgroup label="Claimed">
                            <option value="email">Email link</option>
                            <option value="revoke">Revoke latest</option>
                          </optgroup>
                        )}
                        <optgroup label="Manage">
                          <option value="special">
                            {user.isVolunteer ? "取消特殊用户" : "标记特殊用户"}
                          </option>
                          <option value="delete">Delete user</option>
                        </optgroup>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "credits" && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredCredits?.map((credit) => (
                  <tr key={credit.id} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-mono text-xs">{credit.code}</td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-400">
                      {credit.link}
                    </td>
                    <td className="px-4 py-3">
                      {credit.isTest ? (
                        <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-400">
                          TEST
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                          Real
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {credit.isUsed ? (
                        <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-400">
                          Used
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {credit.assignedAt
                        ? new Date(credit.assignedAt).toLocaleDateString("en-US")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSubmit={async (userData) => {
            await executeAction("ADD_ELIGIBLE_USER", userData);
            setShowAddUserModal(false);
          }}
        />
      )}

      {showAddCreditModal && (
        <AddCreditModal
          onClose={() => setShowAddCreditModal(false)}
          onSubmit={async (creditData) => {
            await executeAction("ADD_CREDIT", creditData);
            setShowAddCreditModal(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10",
    green: "border-green-500/30 bg-green-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    cyan: "border-cyan-500/30 bg-cyan-500/10",
    pink: "border-pink-500/30 bg-pink-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-500/20 text-green-400",
    pending_approval: "bg-yellow-500/20 text-yellow-400",
    declined: "bg-red-500/20 text-red-400",
    waitlist: "bg-gray-500/20 text-gray-400",
    invited: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

function AddUserModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-bold">Add Eligible User</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 py-3 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ email, company, approvalStatus: "approved" })}
            className="flex-1 rounded-lg bg-white py-3 font-medium text-black hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCreditModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [isTest, setIsTest] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-bold">Add Credit</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Code (e.g. ABC123XYZ)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
          <input
            type="url"
            placeholder="Full link (https://cursor.com/...)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900"
            />
            <span className="text-sm text-gray-300">Test credit (TEST)</span>
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 py-3 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ code, link, isTest })}
            className="flex-1 rounded-lg bg-white py-3 font-medium text-black hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
