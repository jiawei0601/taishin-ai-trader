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

  private async runCheck() {
    let report = `📊 **定時行情回報 (${new Date().toLocaleTimeString()})**\n\n`;

    for (const symbol of monitorSymbols) {
      const result = await this.taishin.getQuote(symbol);
      if (result.success) {
        const q = result.data;
        report += `${q.symbol}: $${q.lastPrice.toFixed(2)} (${q.change}%)\n`;
        
        // 策略邏輯：如果價格低於某個數值則觸發交易 (此處為範例)
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
