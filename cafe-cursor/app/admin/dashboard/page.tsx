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
  hasClaimed: boolean;
  claimedAt: string | null;
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
 * Admin dashboard — Chinese UI (no name column)
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
      setError("加载失败，请刷新重试");
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
        alert(`出错：${json.error}`);
      } else {
        alert(json.message || "操作完成");
        fetchDashboard();
      }
    } catch (err) {
      alert("操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCredit = async (email: string, useTest: boolean = false) => {
    if (confirm(`确认给 ${email} 分配${useTest ? "测试" : "正式"}学分？`)) {
      await executeAction("ASSIGN_CREDIT", { email, useTestCredit: useTest });
    }
  };

  const handleRevokeCredit = async (userId: string, email: string) => {
    if (confirm(`确认撤销 ${email} 的学分？学分会重新变为可用。`)) {
      await executeAction("REVOKE_CREDIT", { userId });
    }
  };

  const handleSendEmail = async (userId: string, email: string) => {
    const locale = confirm(
      `邮件语言？\n\n确定 = 中文\n取消 = English`
    )
      ? "zh"
      : "en";
    await executeAction("SEND_CREDIT_EMAIL", { userId, locale });
  };

  const handleSyncSheet = async () => {
    if (
      !confirm(
        "从 Google Sheet 同步学分链接？\n\n只会导入新链接，已有的会跳过。"
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
    // Cancel = all approved (what we want); OK = checked-in only
    const onlyCheckedIn = confirm(
      "导入范围：\n\n确定 = 只导入「已签到」\n取消 = 导入全部「已批准报名」（推荐）"
    );

    await executeAction("IMPORT_LUMA_CSV", {
      csvText,
      onlyApproved: true,
      onlyCheckedIn,
    });
  };

  const handleSyncLumaApi = async () => {
    if (
      !confirm(
        "通过 Luma API 同步？需要 Luma Plus。\n\n没有 Plus 请用「导入 Luma CSV」。"
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
        <div className="text-white">加载中…</div>
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
              <h1 className="text-lg font-bold">Cafe Cursor 管理后台</h1>
              <p className="text-xs text-gray-400">上海活动学分发放</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/host"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              二维码物料
            </a>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            label="学分总数"
            value={data?.stats.totalCredits || 0}
            color="blue"
          />
          <StatCard
            label="可用"
            value={data?.stats.availableCredits || 0}
            color="green"
          />
          <StatCard
            label="已用"
            value={data?.stats.usedCredits || 0}
            color="orange"
          />
          <StatCard
            label="测试"
            value={data?.stats.testCredits || 0}
            color="purple"
          />
          <StatCard
            label="已登记用户"
            value={data?.stats.totalEligible || 0}
            color="cyan"
          />
          <StatCard
            label="已领取"
            value={data?.stats.claimedUsers || 0}
            color="pink"
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
              用户 ({data?.stats.totalEligible ?? data?.eligibleUsers.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("credits")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "credits"
                  ? "bg-white text-black"
                  : "border border-gray-700 hover:bg-gray-800"
              }`}
            >
              学分 ({data?.stats.totalCredits ?? data?.credits.length ?? 0})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="搜索…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm placeholder:text-gray-500 focus:border-white focus:outline-none"
            />
            <button
              onClick={() => setShowAddUserModal(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-700"
            >
              + 用户
            </button>
            <button
              onClick={() => setShowAddCreditModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              + 学分
            </button>
            <button
              onClick={handleSyncSheet}
              disabled={actionLoading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              同步 Sheet
            </button>
            <input
              ref={lumaCsvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportLumaCsvFile}
            />
            <button
              onClick={handleImportLumaCsvClick}
              disabled={actionLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              导入 Luma CSV
            </button>
            <button
              onClick={handleSyncLumaApi}
              disabled={actionLoading}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
              title="需要 Luma Plus"
            >
              Luma API
            </button>
            <button
              onClick={fetchDashboard}
              disabled={actionLoading}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              刷新
            </button>
          </div>
        </div>

        {activeTab === "users" && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">邮箱</th>
                  <th className="px-4 py-3 font-medium">公司</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">学分</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                    <td className="px-4 py-3 text-gray-400">{user.company || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.approvalStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {user.hasClaimed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                          ✓ {user.credit?.code}
                          {user.credit?.isTest && " (测试)"}
                        </span>
                      ) : (
                        <span className="text-gray-500">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!user.hasClaimed && user.approvalStatus === "approved" && (
                          <>
                            <button
                              onClick={() => handleAssignCredit(user.email, false)}
                              disabled={actionLoading}
                              className="rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              分配
                            </button>
                            <button
                              onClick={() => handleAssignCredit(user.email, true)}
                              disabled={actionLoading}
                              className="rounded bg-purple-600 px-2 py-1 text-xs hover:bg-purple-700 disabled:opacity-50"
                            >
                              测试
                            </button>
                          </>
                        )}
                        {user.hasClaimed && (
                          <>
                            <button
                              onClick={() => handleSendEmail(user.id, user.email)}
                              disabled={actionLoading}
                              className="rounded bg-cyan-600 px-2 py-1 text-xs hover:bg-cyan-700 disabled:opacity-50"
                              title="发送学分邮件"
                            >
                              发邮件
                            </button>
                            <button
                              onClick={() => handleRevokeCredit(user.id, user.email)}
                              disabled={actionLoading}
                              className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              撤销
                            </button>
                          </>
                        )}
                      </div>
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
                  <th className="px-4 py-3 font-medium">代码</th>
                  <th className="px-4 py-3 font-medium">链接</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">分配时间</th>
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
                          测试
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                          正式
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {credit.isUsed ? (
                        <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-400">
                          已用
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                          可用
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {credit.assignedAt
                        ? new Date(credit.assignedAt).toLocaleDateString("zh-CN")
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
  const labels: Record<string, string> = {
    approved: "已批准",
    pending_approval: "待审核",
    declined: "已拒绝",
    waitlist: "候补",
    invited: "已邀请",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {labels[status] || status}
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
        <h2 className="mb-4 text-lg font-bold">添加用户</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="公司（可选）"
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
            取消
          </button>
          <button
            onClick={() => onSubmit({ email, company, approvalStatus: "approved" })}
            className="flex-1 rounded-lg bg-white py-3 font-medium text-black hover:opacity-90"
          >
            添加
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
        <h2 className="mb-4 text-lg font-bold">添加学分</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="代码（如 ABC123XYZ）"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
          />
          <input
            type="url"
            placeholder="完整链接（https://cursor.com/...）"
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
            <span className="text-sm text-gray-300">测试学分</span>
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 py-3 hover:bg-gray-800"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit({ code, link, isTest })}
            className="flex-1 rounded-lg bg-white py-3 font-medium text-black hover:opacity-90"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
