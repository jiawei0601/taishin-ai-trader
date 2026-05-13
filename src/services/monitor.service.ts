import cron from 'node-cron';
import { TaishinClient } from '../clients/taishin.client';
import { monitorSymbols } from '../config';

export class MonitorService {
  constructor(
    private taishin: TaishinClient,
    private onReport: (message: string) => Promise<void>,
    private onTradeTrigger: (symbol: string, price: number) => Promise<void>
  ) {}

  /**
   * 啟動監控 (每 5 分鐘一次)
   */
  start() {
    console.log(`[MonitorService] Started monitoring symbols: ${monitorSymbols.join(', ')}`);
    
    // 設定 Cron Job: */5 * * * * (每 5 分鐘)
    cron.schedule('*/5 * * * *', async () => {
      await this.runCheck();
    });

    // 立即執行一次
    this.runCheck();
  }

  /**
   * 判斷台股是否開盤 (09:00 - 13:30, 周一至周五)
   */
  private isMarketOpen(): boolean {
    const now = new Date();
    // 強制轉換為台北時間進行判斷
    const taipeiTime = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'narrow'
    }).formatToParts(now);

    const getTimePart = (type: string) => taipeiTime.find(p => p.type === type)?.value;
    
    const day = now.getUTCDay(); // 此處需注意，建議用 taipeiTime 的 weekday
    // 獲取台北時間的時、分、星期
    const hour = parseInt(getTimePart('hour') || '0');
    const minute = parseInt(getTimePart('minute') || '0');
    const weekday = now.toLocaleDateString('en-US', { timeZone: 'Asia/Taipei', weekday: 'short' });

    // 周末不開盤
    if (weekday === 'Sat' || weekday === 'Sun') return false;

    // 轉為分鐘數計算 (09:00 = 540, 13:30 = 810)
    const currentMinutes = hour * 60 + minute;
    return currentMinutes >= 540 && currentMinutes <= 810;
  }

  private async runCheck() {
    if (!this.isMarketOpen()) {
      console.log(`[MonitorService] Market is closed. Skipping check. (${new Date().toISOString()})`);
      return;
    }

    let report = `📊 **定時行情回報 (${new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })})**\n\n`;

    for (const symbol of monitorSymbols) {
      const result = await this.taishin.getQuote(symbol);
      if (result.success) {
        const q = result.data;
        report += `${q.symbol}: $${q.lastPrice.toFixed(2)} (${q.change}%)\n`;
        
        // 策略邏輯：如果價格低於某個數值則觸發交易
        if (symbol === '2330' && q.lastPrice < 550) {
          await this.onTradeTrigger(symbol, q.lastPrice);
        }
      } else {
        report += `${symbol}: 取得失敗 (${result.error.message})\n`;
      }
    }

    await this.onReport(report);
  }
}
