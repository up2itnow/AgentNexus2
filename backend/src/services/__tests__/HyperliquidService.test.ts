import { HyperliquidService } from '../HyperliquidService';

describe('HyperliquidService', () => {
  let service: HyperliquidService;

  beforeEach(() => {
    service = new HyperliquidService();
  });

  describe('calculatePositionSize', () => {
    it('should calculate correct position size for long position', () => {
      const result = service.calculatePositionSize(
        '1000', // account balance
        2,      // 2% risk
        '50000', // entry price
        '45000', // stop loss
        'ETH'
      );

      // Risk amount = 1000 * 0.02 = $20
      // Price difference = 50000 - 45000 = $5000
      // Position size = 20 / 5000 = 0.004
      expect(result).toBe('0.00400000');
    });

    it('should calculate correct position size for short position', () => {
      const result = service.calculatePositionSize(
        '1000',  // account balance
        2,       // 2% risk
        '45000', // entry price (short)
        '50000', // stop loss (short)
        'ETH'
      );

      // Risk amount = 1000 * 0.02 = $20
      // Price difference = 50000 - 45000 = $5000
      // Position size = 20 / 5000 = 0.004
      expect(result).toBe('0.00400000');
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate liquidation price for long position', () => {
      const result = service.calculateLiquidationPrice(
        '50000', // entry price
        10,      // 10x leverage
        true,    // long position
        0.005    // 0.5% MMR
      );

      // Long liquidation = Entry * (1 - MMR / Leverage) = 50000 * (1 - 0.005 / 10) = 50000 * 0.9995 = 49975
      expect(result).toBe('49975.00000000');
    });

    it('should calculate liquidation price for short position', () => {
      const result = service.calculateLiquidationPrice(
        '50000', // entry price
        10,      // 10x leverage
        false,   // short position
        0.005    // 0.5% MMR
      );

      // Short liquidation = Entry * (1 + MMR / Leverage) = 50000 * (1 + 0.005 / 10) = 50000 * 1.0005 = 50025
      expect(result).toBe('50025.00000000');
    });
  });

  describe('checkLiquidationRisk', () => {
    it('should return safe for position far from liquidation', () => {
      const result = service.checkLiquidationRisk(
        '50000',    // entry price
        '55000',    // current price (long position)
        '49975',    // liquidation price
        true        // long position
      );

      expect(result).toBe('safe');
    });

    it('should return warning for position near liquidation', () => {
      const result = service.checkLiquidationRisk(
        '50000',    // entry price
        '50050',    // current price (long position)
        '49975',    // liquidation price
        true        // long position
      );

      expect(result).toBe('warning');
    });

    it('should return danger for position at liquidation', () => {
      const result = service.checkLiquidationRisk(
        '50000',    // entry price
        '49975',    // current price (long position)
        '49975',    // liquidation price
        true        // long position
      );

      expect(result).toBe('danger');
    });
  });

  describe('API Integration', () => {
    // These tests would require actual API access and should be run with proper credentials
    // For now, they're commented out to avoid failing in CI

    /*
    it('should get market data for a symbol', async () => {
      const marketData = await service.getMarketData('BTC');
      expect(marketData).toHaveProperty('symbol');
      expect(marketData).toHaveProperty('markPrice');
    });

    it('should get order book for a symbol', async () => {
      const orderBook = await service.getOrderBook('BTC', 5);
      expect(orderBook).toHaveProperty('bids');
      expect(orderBook).toHaveProperty('asks');
      expect(orderBook.bids.length).toBeLessThanOrEqual(5);
    });

    it('should get account information', async () => {
      // This would require a valid user address
      const accountInfo = await service.getAccountInfo('0x...');
      expect(accountInfo).toHaveProperty('accountValue');
    });
    */
  });
});
