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
    alreadyClaimedAskStaff: "链接不会再次显示。如需找回，请找现场工作人员或 Admin。",
    congratsMessage: "恭喜！这是你的 Cursor credits：",
    registeredAs: "邮箱：",
    testWarning: "⚠️ 这是测试 credits（不可用于正式使用）",
    yourCredit: "你的 Cursor credits",
    copyLink: "复制链接",
    useCredit: "使用 credits →",
    saveLink: "请保存此链接，每人唯一。",
    mustClickUseButton:
      "重要：一定要点击白色「使用 credits →」按键打开链接，否则 credits 不会充进你的 Cursor 账户。仅复制链接不够。",
    successHint:
      "点击白色按键打开链接后，请在 Cursor Balance 确认 credits 已到账；之后充值与使用时都可抵扣。",
    havingTrouble: "遇到问题？",
    troubleTitle: "先自查（页面提示，不会自动发送）",
    troubleReasons:
      "常见原因：① 没点白色「使用 credits →」；② Cursor 登录邮箱 ≠ Luma 报名/签到邮箱；③ 打开链接但没完成登录/确认。",
    troubleCheckUsage:
      "一般到这里看有没有到账：",
    troubleUsageUrl: "https://cursor.com/dashboard/spending",
    troubleVerifyAccount:
      "核对：Cursor 当前登录邮箱必须 = Luma 当时注册/签到的邮箱。",
    troubleUnifiedSolve:
      "自查仍不行 → 统一找现场志愿者处理（不要自己反复换邮箱乱试）。志愿者会按签到邮箱帮你核对 / 必要时后台协助。",
    troubleAskStaff:
      "活动后请提交工单（必须附 Spending 页截图；cafe@ 只发信不收信）：",
    troubleTicketCta: "提交工单 →",

    // Support ticket (/help)
    ticketPageTitle: "工单帮助",
    ticketPageSubtitle:
      "上传 Spending 截图（须能看清账号邮箱）。换账号领取须两张。主办在 Admin 处理。",
    ticketTitle: "提交工单",
    ticketIntro:
      "Spending 截图须能看清账号邮箱。若换账号领取，两个账号各截一张。",
    ticketEmailLabel: "联系 / Cursor 登录邮箱",
    ticketLumaLabel: "Luma 签到邮箱（换账号时必填）",
    ticketLumaPlaceholder: "与联系邮箱不同时填写另一账号",
    ticketCategoryLabel: "问题类型",
    ticketCatNotLanded: "Credits 没到账",
    ticketCatMismatch: "换账号领取（签到邮箱 ≠ 领取/登录邮箱）",
    ticketCatClaimed: "已领取但找不到链接",
    ticketCatOther: "其他",
    ticketMessageLabel: "问题描述",
    ticketMessagePlaceholder:
      "例如：要用 B 邮箱领取，A 是签到邮箱；已附两张 Spending 截图…",
    ticketScreenshotLabel: "截图① Cursor / 联系邮箱 Spending（必填）",
    ticketScreenshotHint:
      "登录该账号打开 https://cursor.com/dashboard/spending，截图须能看清页面上的账号邮箱。",
    ticketScreenshot2Label: "截图② 另一账号 Spending（换账号必填）",
    ticketScreenshot2Hint:
      "登录另一账号（通常是 Luma 签到邮箱）再截 Spending；同样须能看清账号邮箱。非换账号可留空。",
    ticketScreenshotOpen: "打开 Spending 页",
    ticketScreenshotMissing: "请先上传截图①（须显示账号邮箱）",
    ticketScreenshot2Missing: "换账号领取须同时上传截图②（另一账号，须显示邮箱）",
    ticketScreenshotBad: "图片处理失败，请换一张更小的截图",
    ticketSubmit: "提交工单",
    ticketSubmitting: "提交中…",
    ticketSuccessTitle: "工单已收到",
    ticketSuccessBody: "主办会按两账号截图 + 签到邮箱核对。请保留工单编号。",
    ticketIdLabel: "工单编号",
    ticketBackHome: "返回领取页",
    ticketError: "提交失败，请稍后重试。",
    ticketPrivacyNote:
      "你的联系方式与截图仅用于处理本工单；不会公开。",

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
    alreadyClaimedAskStaff:
      "Your link is not shown again here. Ask staff or Admin if you need it.",
    congratsMessage: "Congratulations! Here are your Cursor credits:",
    registeredAs: "Email:",
    testWarning: "⚠️ This is a TEST credit (not valid for real use)",
    yourCredit: "Your Cursor credits",
    copyLink: "Copy link",
    useCredit: "Use credits →",
    saveLink: "Save this link — it's unique to you.",
    mustClickUseButton:
      "Important: you must tap the white “Use credits →” button to open the link, or credits will not be added to your Cursor account. Copying alone is not enough.",
    successHint:
      "After tapping the white button and opening the link, check Cursor Balance to confirm credits arrived — they apply to future top-ups and usage.",
    havingTrouble: "Having trouble?",
    troubleTitle: "Self-check first (on-page help — nothing is auto-sent)",
    troubleReasons:
      "Common causes: (1) didn’t tap white “Use credits →”; (2) Cursor login email ≠ Luma register/check-in email; (3) opened the link but didn’t finish login/confirm.",
    troubleCheckUsage: "Usually check whether it landed here:",
    troubleUsageUrl: "https://cursor.com/dashboard/spending",
    troubleVerifyAccount:
      "Verify: your current Cursor login email must equal the Luma register/check-in email.",
    troubleUnifiedSolve:
      "Still stuck → ask an on-site volunteer (one unified path — don’t keep trying random emails). Volunteers verify against the check-in email / assist via Admin if needed.",
    troubleAskStaff:
      "After the event, submit a ticket (Spending-page screenshot required — do not email cafe@; that address is send-only):",
    troubleTicketCta: "Submit a ticket →",

    // Support ticket (/help)
    ticketPageTitle: "Support ticket",
    ticketPageSubtitle:
      "Upload Spending screenshot(s) with the account email visible. Account swap needs both.",
    ticketTitle: "Submit a ticket",
    ticketIntro:
      "Screenshots must show the account email. For account swap, upload one Spending shot per account.",
    ticketEmailLabel: "Contact / Cursor login email",
    ticketLumaLabel: "Luma check-in email (required when swapping)",
    ticketLumaPlaceholder: "The other account if different from contact",
    ticketCategoryLabel: "Issue type",
    ticketCatNotLanded: "Credits did not land",
    ticketCatMismatch: "Account swap (check-in email ≠ redeem / login)",
    ticketCatClaimed: "Already claimed but lost the link",
    ticketCatOther: "Other",
    ticketMessageLabel: "Description",
    ticketMessagePlaceholder:
      "e.g. Want to redeem on account B; A is check-in; both Spending shots attached…",
    ticketScreenshotLabel: "Shot ① Cursor / contact Spending (required)",
    ticketScreenshotHint:
      "Log into that account, open https://cursor.com/dashboard/spending — email must be visible in the shot.",
    ticketScreenshot2Label: "Shot ② other account Spending (required for swap)",
    ticketScreenshot2Hint:
      "Log into the other account (usually Luma check-in), screenshot Spending with email visible. Optional if not swapping.",
    ticketScreenshotOpen: "Open Spending page",
    ticketScreenshotMissing: "Please upload shot ① (email must be visible)",
    ticketScreenshot2Missing:
      "Account swap requires shot ② (other account, email visible)",
    ticketScreenshotBad: "Could not process image — try a smaller crop",
    ticketSubmit: "Submit ticket",
    ticketSubmitting: "Submitting…",
    ticketSuccessTitle: "Ticket received",
    ticketSuccessBody:
      "We’ll verify both account screenshots + check-in email. Keep your ticket ID.",
    ticketIdLabel: "Ticket ID",
    ticketBackHome: "Back to redeem",
    ticketError: "Could not submit. Please try again.",
    ticketPrivacyNote:
      "Your contact details and screenshots are only used to resolve this ticket.",

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
