export type Locale = "zh" | "en";

export const translations = {
  zh: {
    // Header
    title: "Cafe Cursor",
    subtitle: "领取你的 Cursor credits。",
    cta: "用已 checked in 的 Luma 邮箱几秒即可兑换。",

    // Form
    nameLabel: "姓名",
    namePlaceholder: "你的姓名",
    emailLabel: "邮箱",
    emailPlaceholder: "你的邮箱",
    emailHint: "请使用已 checked in 的 Luma 报名邮箱",
    checkinLabel: "签到码",
    checkinPlaceholder: "活动签到码",
    checkinHint: "签到后在入口领取签到码",
    checkinFromQr: "已通过二维码签到",
    checkinFromQrHint: "签到码已自动填入，只需填写邮箱。",
    submitButton: "领取 Cursor credits",
    submitting: "验证中...",

    // Footer
    footerNote: "仅限 Luma 报名名单中签到 / checked in 的邮箱领取 credits。",
    onePerPerson: "每人限领一份。",
    madeBy: "主办",
    ambassadors: "Aileen",
    ambassadorTitle: "Cafe Cursor Shanghai",
    poweredBy: "Powered by",

    // Badge
    creditsAvailable: "credits 可用",
    noCredits: "暂无可用 credits",
    loading: "加载中...",
    alreadyClaimed: "位参与者已领取",
    of: "/",

    // Success
    successTitle: "Credits 已发放！",
    alreadyHaveCredit: "你已经领取过 credits！",
    congratsMessage: "恭喜！这是你的 Cursor credits：",
    registeredAs: "邮箱：",
    testWarning: "⚠️ 这是测试 credits（不可用于正式使用）",
    yourCredit: "你的 Cursor credits",
    copyLink: "复制链接",
    useCredit: "使用 credits →",
    saveLink: "请保存此链接，每人唯一。",

    // Errors
    notEligible: "请先找工作人员完成现场 Luma checked in，再来领取。",
    notApproved: "你的报名尚未通过审核，请联系主办方。",
    badCheckinCode: "签到码无效。请先在入口完成签到。",
    noCreditsAvailable: "抱歉，当前没有可用 credits，请联系主办方。",
    networkError: "网络错误，请重试。",
    thinkError: "若认为是错误，请联系活动主办方。",
    pendingApproval: "你的申请正在审核中。",
    tryAnotherEmail: "换邮箱",

    // Share
    shareOnX: "分享到 X",
    shareMessage:
      "🚀 刚在 Cafe Cursor Shanghai 领到 @cursor_ai credits！感谢社区。#CafeCursorShanghai #CursorAI",

    // Email
    emailSent: "📧 credits 已发送到你的邮箱！",
    emailNotSent: "📧 邮件暂时无法发送 — 请先保存上方链接。",
  },
  en: {
    // Header
    title: "Cafe Cursor",
    subtitle: "Get your Cursor credits.",
    cta: "Redeem in seconds with your checked-in Luma email.",

    // Form
    nameLabel: "Name",
    namePlaceholder: "Your full name",
    emailLabel: "Email",
    emailPlaceholder: "Your email",
    emailHint: "Use your checked-in Luma registration email",
    checkinLabel: "Check-in code",
    checkinPlaceholder: "Event code",
    checkinHint: "Get this code at the door after check-in",
    checkinFromQr: "Checked in via QR",
    checkinFromQrHint: "Code filled automatically. Just enter your email.",
    submitButton: "Get Cursor credits",
    submitting: "Verifying...",

    // Footer
    footerNote:
      "Only checked-in emails on the Luma guest list can redeem credits.",
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
    successTitle: "Credits assigned!",
    alreadyHaveCredit: "You already claimed your credits!",
    congratsMessage: "Congratulations! Here are your Cursor credits:",
    registeredAs: "Email:",
    testWarning: "⚠️ This is a TEST credit (not valid for real use)",
    yourCredit: "Your Cursor credits",
    copyLink: "Copy link",
    useCredit: "Use credits →",
    saveLink: "Save this link — it's unique to you.",

    // Errors
    notEligible:
      "Please ask the staff to check you in on Luma first, then redeem.",
    notApproved:
      "Your event registration hasn't been approved yet. Please contact the organizer.",
    badCheckinCode: "Invalid check-in code. Please check in at the door first.",
    noCreditsAvailable:
      "Sorry, no credits are available right now. Please contact the organizer.",
    networkError: "Connection error. Please try again.",
    thinkError: "Think this is an error? Contact the event organizer.",
    pendingApproval: "Your request is pending approval.",
    tryAnotherEmail: "Try another email",

    // Share
    shareOnX: "Share on X",
    shareMessage:
      "🚀 Just got @cursor_ai credits at Cafe Cursor Shanghai! Thanks to the community. #CafeCursorShanghai #CursorAI",

    // Email
    emailSent: "📧 We sent the credits to your email!",
    emailNotSent:
      "📧 Email could not be sent right now — please save the link above.",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
