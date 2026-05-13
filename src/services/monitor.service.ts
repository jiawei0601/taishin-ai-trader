import cron from 'node-cron';
import { TaishinClient } from '../clients/taishin.client';
import { monitorSymbols } from '../config';

export class MonitorService {
  constructor(
    private taishin: TaishinClient,
    private binance: BinanceClient,
    private onReport: (message: string) => Promise<void>,
    private onTradeTrigger: (source: 'TW' | 'CRYPTO', symbol: string, price: number) => Promise<void>
  ) {}

  /**
   * 啟動監控 (每 5 分鐘一次)
   */
  start() {
    console.log(`[MonitorService] Started monitoring TW symbols: ${monitorSymbols.join(', ')}`);
    console.log(`[MonitorService] Started monitoring Crypto symbols: ${cryptoSymbols.join(', ')}`);
    
    cron.schedule('*/5 * * * *', async () => {
      await this.runCheck();
    });

    this.runCheck();
  }

  /**
   * 判斷台股是否開盤 (09:00 - 13:30, 周一至周五)
   */
  private isTWMarketOpen(): boolean {
    const now = new Date();
    const taipeiTime = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(now);

    const getTimePart = (type: string) => taipeiTime.find(p => p.type === type)?.value;
    const hour = parseInt(getTimePart('hour') || '0');
    const minute = parseInt(getTimePart('minute') || '0');
    const weekday = now.toLocaleDateString('en-US', { timeZone: 'Asia/Taipei', weekday: 'short' });

    if (weekday === 'Sat' || weekday === 'Sun') return false;
    const currentMinutes = hour * 60 + minute;
    return currentMinutes >= 540 && currentMinutes <= 810;
  }

  private async runCheck() {
    let report = `📊 **定時行情回報 (${new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })})**\n\n`;

    // 1. 處理台股 (僅在開盤時)
    if (this.isTWMarketOpen()) {
      report += `🇹🇼 **台股行情**：\n`;
      for (const symbol of monitorSymbols) {
        const result = await this.taishin.getQuote(symbol);
        if (result.success) {
          const q = result.data;
          report += `${q.symbol}: $${q.lastPrice.toFixed(2)} (${q.change}%)\n`;
          // 範例觸發：台積電低於 550
          if (symbol === '2330' && q.lastPrice < 550) {
            await this.onTradeTrigger('TW', symbol, q.lastPrice);
          }
        }
      }
      report += `\n`;
    }

    // 2. 處理加密貨幣 (24/7)
    report += `₿ **加密貨幣行情**：\n`;
    for (const symbol of cryptoSymbols) {
      const result = await this.binance.getQuote(symbol);
      if (result.success) {
        const q = result.data;
        report += `${q.symbol}: $${q.lastPrice.toFixed(2)} (${q.change.toFixed(2)}%)\n`;
        // 範例觸發：BTC 低於 60000
        if (symbol === 'BTCUSDT' && q.lastPrice < 60000) {
          await this.onTradeTrigger('CRYPTO', symbol, q.lastPrice);
        }
      } else {
        report += `${symbol}: 取得失敗\n`;
      }
    }

    await this.onReport(report);
  }
}
