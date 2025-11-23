import axios, { AxiosInstance, AxiosResponse } from 'axios';
// import { ethers } from 'ethers';

interface MarketData {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  fundingRate: string;
  openInterest: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  lastPrice: string;
  timestamp: number;
}

interface OrderBook {
  bids: [string, string][]; // [price, size][]
  asks: [string, string][]; // [price, size][]
  timestamp: number;
}

interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market';
  quantity: string;
  price?: string;
  reduceOnly?: boolean;
  postOnly?: boolean;
  timeInForce?: 'gtc' | 'ioc' | 'fok';
}

interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  percentage: string;
  marginUsed: string;
  liquidationPrice: string;
}

interface AccountInfo {
  accountValue: string;
  totalPositionMargin: string;
  totalUnrealizedPnl: string;
  availableBalance: string;
  positions: Position[];
}

export class HyperliquidService {
  private client: AxiosInstance;
  // private _wsUrl: string = 'wss://api.hyperliquid.xyz/ws';

  constructor(apiKey?: string, baseUrl: string = 'https://api.hyperliquid.xyz') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Hyperliquid-Key': apiKey || '',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        console.error('Hyperliquid API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get market data for a specific symbol or all symbols
   */
  async getMarketData(symbol?: string): Promise<MarketData | MarketData[]> {
    try {
      const payload = symbol
        ? { type: 'marketData', symbol }
        : { type: 'marketData' };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      if (symbol) {
        return this.transformMarketData(response.data);
      }

      return response.data.map((data: any) => this.transformMarketData(data));
    } catch (error) {
      throw new Error(`Failed to get market data: ${error}`);
    }
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBook> {
    try {
      const payload = {
        type: 'l2Book',
        symbol,
        depth
      };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      return {
        bids: response.data.bids || [],
        asks: response.data.asks || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to get order book: ${error}`);
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(order: Order, userAddress: string): Promise<string> {
    try {
      // In a real implementation, this would use the user's private key for signing
      // For now, we'll simulate the order placement

      const orderPayload = {
        type: 'order',
        user: userAddress,
        ...order,
        timestamp: Date.now(),
      };

      // Note: This is a simplified implementation
      // In production, you'd need proper authentication and signing
      console.log('Placing order:', orderPayload);

      // Simulate order placement delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Return a mock order ID
      return `hl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      throw new Error(`Failed to place order: ${error}`);
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string, symbol: string, userAddress: string): Promise<boolean> {
    try {
      const cancelPayload = {
        type: 'cancel',
        user: userAddress,
        orderId,
        symbol,
        timestamp: Date.now(),
      };

      console.log('Canceling order:', cancelPayload);

      // Simulate cancellation delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  /**
   * Get account information and positions
   */
  async getAccountInfo(userAddress: string): Promise<AccountInfo> {
    try {
      const payload = {
        type: 'accountInfo',
        user: userAddress,
      };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      return {
        accountValue: response.data.accountValue || '0',
        totalPositionMargin: response.data.totalPositionMargin || '0',
        totalUnrealizedPnl: response.data.totalUnrealizedPnl || '0',
        availableBalance: response.data.availableBalance || '0',
        positions: response.data.positions || [],
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error}`);
    }
  }

  /**
   * Get recent trades for a symbol
   */
  async getRecentTrades(symbol: string, limit: number = 100): Promise<any[]> {
    try {
      const payload = {
        type: 'recentTrades',
        symbol,
        limit,
      };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get recent trades: ${error}`);
    }
  }

  /**
   * Get funding rate history for a symbol
   */
  async getFundingRateHistory(symbol: string, hours: number = 24): Promise<any[]> {
    try {
      const payload = {
        type: 'fundingRateHistory',
        symbol,
        hours,
      };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get funding rate history: ${error}`);
    }
  }

  /**
   * Calculate optimal position size based on risk management
   */
  calculatePositionSize(
    accountBalance: string,
    riskPercentage: number,
    entryPrice: string,
    stopLossPrice: string,
    _symbol: string
  ): string {
    const balance = parseFloat(accountBalance);
    const riskAmount = balance * (riskPercentage / 100);
    const priceDiff = Math.abs(parseFloat(entryPrice) - parseFloat(stopLossPrice));

    if (priceDiff === 0) return '0';

    // Position size = Risk amount / Price difference
    const positionSize = riskAmount / priceDiff;

    return positionSize.toFixed(8);
  }

  /**
   * Get trading fees for a symbol
   */
  async getTradingFees(symbol: string): Promise<{ makerFee: string; takerFee: string }> {
    try {
      const payload = {
        type: 'tradingFees',
        symbol,
      };

      const response: AxiosResponse = await this.client.post('/exchange/v1/info', payload);

      return {
        makerFee: response.data.makerFee || '0.0002', // 0.02%
        takerFee: response.data.takerFee || '0.0005', // 0.05%
      };
    } catch (error) {
      // Return default fees if API fails
      return {
        makerFee: '0.0002',
        takerFee: '0.0005',
      };
    }
  }

  /**
   * Validate symbol exists and is tradeable
   */
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      await this.getMarketData(symbol);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available symbols for trading
   */
  async getAvailableSymbols(): Promise<string[]> {
    try {
      const marketData = await this.getMarketData() as MarketData[];

      return marketData.map(market => market.symbol);
    } catch (error) {
      console.error('Failed to get available symbols:', error);
      return [];
    }
  }

  /**
   * Transform raw market data to standardized format
   */
  private transformMarketData(data: any): MarketData {
    return {
      symbol: data.symbol || '',
      markPrice: data.markPx || '0',
      indexPrice: data.indexPx || '0',
      fundingRate: data.fundingRate || '0',
      openInterest: data.openInterest || '0',
      volume24h: data.volume24h || '0',
      high24h: data.high24h || '0',
      low24h: data.low24h || '0',
      lastPrice: data.lastPx || '0',
      timestamp: data.time || Date.now(),
    };
  }

  /**
   * Calculate liquidation price for a position
   */
  calculateLiquidationPrice(
    entryPrice: string,
    leverage: number,
    isLong: boolean,
    maintenanceMarginRate: number = 0.005 // 0.5%
  ): string {
    const entry = parseFloat(entryPrice);
    const mmr = maintenanceMarginRate;

    if (isLong) {
      // For long positions: Liquidation Price = Entry Price * (1 - MMR / Leverage)
      return (entry * (1 - mmr / leverage)).toFixed(8);
    } else {
      // For short positions: Liquidation Price = Entry Price * (1 + MMR / Leverage)
      return (entry * (1 + mmr / leverage)).toFixed(8);
    }
  }

  /**
   * Check if position would be liquidated at current price
   */
  checkLiquidationRisk(
    _entryPrice: string,
    currentPrice: string,
    liquidationPrice: string,
    isLong: boolean
  ): 'safe' | 'warning' | 'danger' {
    // const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    const liquidation = parseFloat(liquidationPrice);

    if (isLong) {
      if (current <= liquidation) return 'danger';
      if (current <= liquidation * 1.1) return 'warning'; // 10% buffer
    } else {
      if (current >= liquidation) return 'danger';
      if (current >= liquidation * 0.9) return 'warning'; // 10% buffer
    }

    return 'safe';
  }
}
