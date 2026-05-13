import Binance, { Binance as BinanceInstance } from 'binance-api-node';
import { config } from '../config';
import { Result, wrapResult, success, failure } from '../utils/result';
import { StockQuote, OrderResponse } from '../schemas/trading.schema';

export class BinanceClient {
  private client: BinanceInstance;

  constructor() {
    this.client = Binance({
      apiKey: config.BINANCE_API_KEY,
      apiSecret: config.BINANCE_API_SECRET,
    });
  }

  /**
   * 取得加密貨幣行情 (適配 StockQuote 格式以利統一行程)
   */
  async getQuote(symbol: string): Promise<Result<StockQuote>> {
    const action = async () => {
      const ticker = await this.client.prices({ symbol });
      const price = parseFloat(ticker[symbol]);
      
      const dailyStats = await this.client.dailyStats({ symbol });
      const stats = Array.isArray(dailyStats) ? dailyStats[0] : dailyStats;

      return {
        symbol,
        lastPrice: price,
        change: parseFloat(stats.priceChangePercent),
        volume: parseFloat(stats.volume),
        timestamp: Date.now(),
      };
    };

    return wrapResult(action(), `BinanceClient.getQuote(${symbol})`);
  }

  /**
   * 下市價單
   */
  async placeOrder(symbol: string, quantity: number): Promise<Result<OrderResponse>> {
    const action = async () => {
      console.log(`[Binance] Executing MARKET BUY: ${symbol} amount ${quantity}`);
      const order = await this.client.order({
        symbol,
        side: 'BUY',
        quantity: quantity.toString(),
        type: 'MARKET',
      });

      return {
        orderId: order.orderId.toString(),
        status: 'FILLED' as const,
        symbol,
        price: parseFloat(order.fills?.[0]?.price || '0'),
        quantity,
      };
    };

    return wrapResult(action(), 'BinanceClient.placeOrder');
  }
}
