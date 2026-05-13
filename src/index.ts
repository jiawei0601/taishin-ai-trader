import { Telegraf } from 'telegraf';
import { config } from './config';
import { TaishinClient } from './clients/taishin.client';
import { MonitorService } from './services/monitor.service';

async function bootstrap() {
  const bot = new Telegraf(config.TELEGRAM_TOKEN);
  const taishin = new TaishinClient();

  console.log('🚀 AI Trader is initializing...');

  // 1. 台新 API 登入
  const loginRes = await taishin.login();
  if (!loginRes.success) {
    console.error('❌ Failed to login to Taishin:', loginRes.error);
    return;
  }

  // 2. 初始化監控服務
  const monitor = new MonitorService(
    taishin,
    async (msg) => { await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID!, msg, { parse_mode: 'Markdown' }); },
    async (symbol, price) => {
      const orderRes = await taishin.placeOrder(symbol, 1000, price);
      const msg = orderRes.success 
        ? `🚨 **自動交易觸發**\n已下單: ${symbol} x 1000 @ ${price}`
        : `❌ **交易失敗**\n原因: ${orderRes.error.message}`;
      await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID!, msg, { parse_mode: 'Markdown' });
    }
  );

  // 3. TG 指令
  bot.command('status', async (ctx) => {
    await ctx.reply('🤖 AI Trader 運作中...\n監控頻率：每 5 分鐘一次');
  });

  bot.command('quote', async (ctx) => {
    const symbol = ctx.message.text.split(' ')[1];
    if (!symbol) return ctx.reply('請輸入代號，如: /quote 2330');
    
    const res = await taishin.getQuote(symbol);
    if (res.success) {
      await ctx.reply(`📈 ${res.data.symbol}: $${res.data.lastPrice}`);
    } else {
      await ctx.reply(`❌ 查詢失敗: ${res.error.message}`);
    }
  });

  // 4. 啟動服務
  monitor.start();
  await bot.launch();
  console.log('✅ AI Trader is online and monitoring!');
}

bootstrap().catch(console.error);
