import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  TELEGRAM_TOKEN: z.string().min(1),
  TAISHIN_ID: z.string().min(1),
  TAISHIN_PASSWORD: z.string().min(1),
  TAISHIN_CERT_PATH: z.string().min(1),
  TAISHIN_CERT_PASSWORD: z.string().min(1),
  MONITOR_SYMBOLS: z.string().default("2330,2317"), // 預設監控台積電、鴻海
});

const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid configuration:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export const monitorSymbols = config.MONITOR_SYMBOLS.split(',');
