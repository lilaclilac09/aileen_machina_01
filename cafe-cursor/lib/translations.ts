export type Locale = "zh" | "en";

export const translations = {
  zh: {
    // Header
    title: "Cafe Cursor",
    subtitle: "领取你的免费 Cursor 学分。",
    cta: "用 Luma 报名邮箱几秒即可兑换。",

    // Form
    nameLabel: "姓名",
    namePlaceholder: "你的姓名",
    emailLabel: "邮箱",
    emailPlaceholder: "你的邮箱",
    emailHint: "请使用 Luma 报名时的同一邮箱",
    checkinLabel: "签到码",
    checkinPlaceholder: "活动签到码",
    checkinHint: "签到后在入口领取签到码",
    checkinFromQr: "已通过二维码签到",
    checkinFromQrHint: "签到码已自动填入，只需填写邮箱。",
    submitButton: "领取 Cursor 学分",
    submitting: "验证中...",

    // Footer
    footerNote: "仅限 Luma 报名名单中的邮箱领取学分。",
    onePerPerson: "每人限领一份。",
    madeBy: "主办",
    ambassadors: "Aileen",
    ambassadorTitle: "Cafe Cursor Shanghai",
    poweredBy: "Powered by",

    // Badge
    creditsAvailable: "个学分可用",
    noCredits: "暂无可用学分",
    loading: "加载中...",
    alreadyClaimed: "位参与者已领取",
    of: "/",

    // Success
    successTitle: "学分已发放！",
    alreadyHaveCredit: "你已经领取过学分！",
    congratsMessage: "恭喜！这是你的 Cursor 学分：",
    registeredAs: "邮箱：",
    testWarning: "⚠️ 这是测试学分（不可用于正式使用）",
    yourCredit: "你的 Cursor 学分",
    copyLink: "复制链接",
    useCredit: "使用学分 →",
    saveLink: "请保存此链接，每人唯一。",

    // Errors
    notEligible: "该邮箱不在参加者名单中。请使用 Luma 报名时的同一邮箱。",
    notApproved: "你的报名尚未通过审核，请联系主办方。",
    badCheckinCode: "签到码无效。请先在入口完成签到。",
    noCreditsAvailable: "抱歉，当前没有可用学分，请联系主办方。",
    networkError: "网络错误，请重试。",
    thinkError: "若认为是错误，请联系活动主办方。",
    pendingApproval: "你的申请正在审核中。",
    tryAnotherEmail: "换一个邮箱试试",

    // Share
    shareOnX: "分享到 X",
    shareMessage:
      "🚀 刚在 Cafe Cursor Shanghai 领到 @cursor_ai 学分！感谢社区。#CafeCursorShanghai #CursorAI",

    // Email
    emailSent: "📧 学分已发送到你的邮箱！",
    emailNotSent: "📧 邮件暂时无法发送 — 请先保存上方链接。",
  },
  en: {
    // Header
    title: "Cafe Cursor",
    subtitle: "Get your Cursor credits.",
    cta: "Redeem in seconds with your Luma email.",

    // Form
    nameLabel: "Name",
    namePlaceholder: "Your full name",
    emailLabel: "Email",
    emailPlaceholder: "Your email",
    emailHint: "Use the same email you registered with on Luma",
    checkinLabel: "Check-in code",
    checkinPlaceholder: "Event code",
    checkinHint: "Get this code at the door after check-in",
    checkinFromQr: "Checked in via QR",
    checkinFromQrHint: "Code filled automatically. Just enter your email.",
    submitButton: "Get your Cursor credits",
    submitting: "Verifying...",

    // Footer
    footerNote: "Only emails on the Luma guest list can redeem credits.",
    onePerPerson: "One credit per person.",
    madeBy: "Made by",
    ambassadors: "Aileen",
    ambassadorTitle: "Cafe Cursor Shanghai",
    poweredBy: "Powered by",

    // Badge
    creditsAvailable: "credits available",
    noCredits: "No credits available",
    loading: "Loading...",
    alreadyClaimed: "attendees already claimed",
    of: "of",

    // Success
    successTitle: "Credit assigned!",
    alreadyHaveCredit: "You already have your credit!",
    congratsMessage: "Congratulations! Here's your Cursor credit:",
    registeredAs: "Email:",
    testWarning: "⚠️ This is a TEST credit (not valid for real use)",
    yourCredit: "Your Cursor credit",
    copyLink: "Copy link",
    useCredit: "Use credit →",
    saveLink: "Save this link, it's unique and personal.",

    // Errors
    notEligible:
      "This email is not on the guest list. Use the same email you registered with on Luma.",
    notApproved:
      "Your event registration hasn't been approved yet. Please contact the organizer.",
    badCheckinCode: "Invalid check-in code. Please check in at the door first.",
    noCreditsAvailable:
      "Sorry, no credits are available at the moment. Please contact the organizer.",
    networkError: "Connection error. Please try again.",
    thinkError: "Think this is an error? Contact the event organizer.",
    pendingApproval: "Your request is pending approval.",
    tryAnotherEmail: "Try with another email",

    // Share
    shareOnX: "Share on X",
    shareMessage:
      "🚀 Just got a @cursor_ai credit at Cafe Cursor Shanghai! Huge thanks to the community. #CafeCursorShanghai #CursorAI #DevCommunity",

    // Email
    emailSent: "📧 We sent the credit to your email!",
    emailNotSent:
      "📧 Email could not be sent right now — please save the link above.",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
