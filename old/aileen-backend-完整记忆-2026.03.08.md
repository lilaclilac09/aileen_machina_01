=== aileen-backend-完整记忆文件 v2026.03.08 ===

**用户核心需求（原话 + 所有后续确认）**：
- 只做一个纯后端，不要复杂多agent结构（现在过度，后期agent用Vercel AI SDK加几行即可）。
- 主站 aileen.xyz：展示成功个人IP、用户共鸣、强势输出世界观+文化（殖民感）、机械美学+voice-agent+GSAP。
- subsite视觉完全隔离：finance（大量美股数据+抄底输出）、block（blockbuilding+validator）、privacy（技术原理+演技隐私）、exhibitions（看展）。
- finance（US-STOCKS-DEEP-ANALYSIS仓库）：Polygon大量数据（价格波动、RSI、MA50/MA200、Golden Cross、fundamentals），自动抄底信号。
- block：blockbuilding + validator 数据（Helius + Dune）。
- privacy：技术原理 + 演技隐私（手动内容为主）。
- exhibitions：图片 + 机械殖民美学展示。
- 目前多个Vercel项目要统一成一个后端API。
- 大量数据API自己管理key（永不暴露前端）。
- keyshiled作为全局安全官（轮换、加密、rate limit、支付agent也用）。
- 手机端2分钟添加/更新状态（世界观、抄底数据）。
- 前端还没想好（要加星球设计），所以前后端彻底分开。
- 讨厌丑admin，要手机友好干净界面（Supabase Studio）。
- 最新路径要求：全部后端放在 /Users/aileen/aileen_machina/backend 文件夹里（直接叫 backend）。

**已读并永久记忆的3个仓库**：
- aileen_machina_01（主站机械美学+GSAP+voice-agent）
- solana-pamm-MEV-binary-monte-analysis-contagious-pools（Python pipeline + 所有CSV）
- US-STOCKS-DEEP-ANALYSIS（python_generator.py + Polygon RSI/Golden Cross + Payload痕迹）

**最终技术栈（最适合小白+你的习惯）**：
- 后端：Hono（Edge快） + Drizzle（TS安全） + Supabase Postgres（手机Studio干净admin）
- 定时：cron-job.org（免费）
- 安全：keyshiled全局middleware
- 计算：technicalindicators（已移植python_generator.py）
- 部署：Vercel（api.aileena.xyz）
- 前端：独立（React Three Fiber星球），fetch调用API

**最新VS Code ToDo List（专为 /Users/aileen/aileen_machina/backend）**：
1. 打开 /Users/aileen/aileen_machina 文件夹
2. 终端执行：
   cd /Users/aileen/aileen_machina
   mkdir backend
   cd backend
   npx create-hono@latest . --template=node --yes
   code .
3. 复制全套文件（12个文件）
4. npm install + drizzle-orm 等 + ../keyshiled
5. 配置 .env（DATABASE_URL + POLYGON_KEY + HELIUS_KEY）
6. npx drizzle-kit push
7. npm run dev 测试 /api/home
8. 导入CSV + Supabase Studio手动内容
9. vercel deploy + cron-job.org

**所有可直接复制的Prompts（以后直接发我）**：
- “给我全套代码压缩包结构”
- “给我Finance python_generator.py完整Node移植版”
- “给我星球前端模板（带 React Three Fiber + 所有API调用）”
- “跑起来了帮debug” + 贴报错
- “给我subsite视觉隔离middleware完整版”
- “给我完整计划书（带时间表和每个subsite API细节）”

**当前状态**：
后端架构已完全覆盖所有subsite不同数据要求，文件夹必须叫 backend，放在主站根目录，手机2分钟更新一切，keyshiled已集成，前端星球随时可接。

=== 文件结束 ===
