import { config } from 'dotenv';
import { z } from 'zod';

console.log('=== 当前工作目录 ===', process.cwd());

// 强制加载 .env 文件
config({ path: '.env' });

console.log('=== 环境变量加载情况 ===');
console.log('FINNHUB_KEY     :', process.env.FINNHUB_KEY ? '✅ 已加载' : '❌ 未加载');
console.log('ALPHA_VANTAGE_KEY:', process.env.ALPHA_VANTAGE_KEY ? '✅ 已加载' : '❌ 未加载');
console.log('SUPABASE_URL    :', process.env.SUPABASE_URL ? '✅ 已加载' : '❌ 未加载');
console.log('SUPABASE_KEY    :', process.env.SUPABASE_KEY ? '✅ 已加载' : '❌ 未加载');

const envSchema = z.object({
  FINNHUB_KEY: z.string().min(1, "FINNHUB_KEY 缺失"),
  ALPHA_VANTAGE_KEY: z.string().min(1, "ALPHA_VANTAGE_KEY 缺失"),
  SUPABASE_URL: z.string().url("SUPABASE_URL 必须是有效 URL"),
  SUPABASE_KEY: z.string().min(1, "SUPABASE_KEY 缺失"),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const env = envSchema.parse(process.env);

console.log('✅ 所有环境变量验证通过！');

export default env;
export type Env = typeof env;
