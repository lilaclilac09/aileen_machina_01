import { config } from 'dotenv';
import { z } from 'zod'; // npm install zod 先执行这行

config(); // 加载 .env

const envSchema = z.object({
  FINNHUB_KEY: z.string().min(1),
  ALPHA_VANTAGE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const env = envSchema.parse(process.env);

export default env;
export type Env = typeof env;
