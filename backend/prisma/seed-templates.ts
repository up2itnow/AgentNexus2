/**
 * Agent Builder Templates & Modules Seed
 * 
 * Seeds the database with agent templates and modules for all three build methods:
 * 1. Beginner: Pre-built templates
 * 2. Hybrid: Modular builder
 * 3. Advanced: Full custom
 */

import { PrismaClient, AgentCategory, TemplateDifficulty, ModuleCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Agent Modules - Building blocks for agents
const modules = [
  // DATA SOURCE MODULES
  {
    name: 'twitter-api',
    displayName: 'Twitter API',
    description: 'Access Twitter/X API for tweets, trends, and user data',
    category: ModuleCategory.DATA_SOURCE,
    baseCost: 1.0,
    executionCost: 0.1,
    configSchema: {
      type: 'object',
      properties: {
        keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords to track' },
        accounts: { type: 'array', items: { type: 'string' }, description: 'Twitter accounts to monitor' },
      },
    },
    defaultConfig: { keywords: [], accounts: [] },
    dependencies: [],
    difficulty: 1,
  },
  {
    name: 'dex-api',
    displayName: 'DEX Data',
    description: 'Real-time data from decentralized exchanges',
    category: ModuleCategory.DATA_SOURCE,
    baseCost: 1.5,
    executionCost: 0.15,
    configSchema: {
      type: 'object',
      properties: {
        dexes: { type: 'array', items: { type: 'string' }, description: 'DEXs to monitor' },
        pairs: { type: 'array', items: { type: 'string' }, description: 'Trading pairs' },
      },
    },
    defaultConfig: { dexes: ['uniswap', 'sushiswap'], pairs: [] },
    dependencies: [],
    difficulty: 2,
  },
  {
    name: 'onchain-data',
    displayName: 'On-Chain Data',
    description: 'Blockchain transaction and contract data',
    category: ModuleCategory.DATA_SOURCE,
    baseCost: 2.0,
    executionCost: 0.2,
    configSchema: {
      type: 'object',
      properties: {
        chains: { type: 'array', items: { type: 'string' }, description: 'Blockchain networks' },
        addresses: { type: 'array', items: { type: 'string' }, description: 'Contract addresses to monitor' },
      },
    },
    defaultConfig: { chains: ['ethereum', 'base'], addresses: [] },
    dependencies: [],
    difficulty: 3,
  },
  {
    name: 'price-feed',
    displayName: 'Price Feed',
    description: 'Real-time cryptocurrency price data',
    category: ModuleCategory.DATA_SOURCE,
    baseCost: 0.5,
    executionCost: 0.05,
    configSchema: {
      type: 'object',
      properties: {
        symbols: { type: 'array', items: { type: 'string' }, description: 'Trading symbols' },
        interval: { type: 'string', enum: ['1m', '5m', '15m', '1h', '4h', '1d'], description: 'Update interval' },
      },
      required: ['symbols'],
    },
    defaultConfig: { symbols: ['BTC/USD', 'ETH/USD'], interval: '5m' },
    dependencies: [],
    difficulty: 1,
  },

  // ANALYSIS MODULES
  {
    name: 'sentiment-analysis',
    displayName: 'Sentiment Analysis',
    description: 'NLP-powered sentiment analysis for text data',
    category: ModuleCategory.ANALYSIS,
    baseCost: 1.5,
    executionCost: 0.2,
    configSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['en', 'es', 'fr', 'de'], description: 'Language' },
        threshold: { type: 'number', minimum: -1, maximum: 1, description: 'Sentiment threshold' },
      },
    },
    defaultConfig: { language: 'en', threshold: 0 },
    dependencies: [],
    difficulty: 2,
  },
  {
    name: 'technical-indicators',
    displayName: 'Technical Indicators',
    description: 'RSI, MACD, EMA, and other technical analysis indicators',
    category: ModuleCategory.ANALYSIS,
    baseCost: 1.0,
    executionCost: 0.1,
    configSchema: {
      type: 'object',
      properties: {
        indicators: { 
          type: 'array', 
          items: { type: 'string', enum: ['RSI', 'MACD', 'EMA', 'SMA', 'BB'] },
          description: 'Indicators to calculate'
        },
        period: { type: 'number', minimum: 5, maximum: 200, description: 'Period for calculations' },
      },
      required: ['indicators'],
    },
    defaultConfig: { indicators: ['RSI', 'MACD'], period: 14 },
    dependencies: ['price-feed'],
    difficulty: 2,
  },
  {
    name: 'volume-analysis',
    displayName: 'Volume Analysis',
    description: 'Trading volume and liquidity analysis',
    category: ModuleCategory.ANALYSIS,
    baseCost: 0.8,
    executionCost: 0.08,
    configSchema: {
      type: 'object',
      properties: {
        timeframe: { type: 'string', enum: ['1h', '4h', '1d', '1w'], description: 'Analysis timeframe' },
      },
    },
    defaultConfig: { timeframe: '1d' },
    dependencies: ['dex-api'],
    difficulty: 2,
  },

  // TRIGGER MODULES
  {
    name: 'price-threshold',
    displayName: 'Price Threshold',
    description: 'Trigger when price crosses a threshold',
    category: ModuleCategory.TRIGGER,
    baseCost: 0.3,
    executionCost: 0.01,
    configSchema: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'Price threshold' },
        direction: { type: 'string', enum: ['above', 'below', 'crosses'], description: 'Trigger direction' },
      },
      required: ['threshold', 'direction'],
    },
    defaultConfig: { threshold: 0, direction: 'above' },
    dependencies: ['price-feed'],
    difficulty: 1,
  },
  {
    name: 'time-interval',
    displayName: 'Time Interval',
    description: 'Trigger at regular time intervals',
    category: ModuleCategory.TRIGGER,
    baseCost: 0.2,
    executionCost: 0.01,
    configSchema: {
      type: 'object',
      properties: {
        interval: { type: 'string', enum: ['5m', '15m', '1h', '4h', '1d'], description: 'Check interval' },
      },
      required: ['interval'],
    },
    defaultConfig: { interval: '1h' },
    dependencies: [],
    difficulty: 1,
  },
  {
    name: 'event-based',
    displayName: 'Event-Based Trigger',
    description: 'Trigger on blockchain events or API webhooks',
    category: ModuleCategory.TRIGGER,
    baseCost: 1.0,
    executionCost: 0.1,
    configSchema: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: 'Event type to monitor' },
        filters: { type: 'object', description: 'Event filters' },
      },
      required: ['eventType'],
    },
    defaultConfig: { eventType: 'Transfer', filters: {} },
    dependencies: ['onchain-data'],
    difficulty: 3,
  },

  // ACTION MODULES
  {
    name: 'alert-notification',
    displayName: 'Alert & Notification',
    description: 'Send alerts via email, SMS, or webhook',
    category: ModuleCategory.ACTION,
    baseCost: 0.5,
    executionCost: 0.05,
    configSchema: {
      type: 'object',
      properties: {
        channels: { type: 'array', items: { type: 'string', enum: ['email', 'webhook', 'discord'] } },
        template: { type: 'string', description: 'Message template' },
      },
      required: ['channels'],
    },
    defaultConfig: { channels: ['webhook'], template: '{{message}}' },
    dependencies: [],
    difficulty: 1,
  },
  {
    name: 'report-generation',
    displayName: 'Report Generation',
    description: 'Generate detailed reports and analytics',
    category: ModuleCategory.ACTION,
    baseCost: 0.8,
    executionCost: 0.1,
    configSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'markdown', 'html', 'pdf'], description: 'Report format' },
        sections: { type: 'array', items: { type: 'string' }, description: 'Report sections' },
      },
      required: ['format'],
    },
    defaultConfig: { format: 'json', sections: [] },
    dependencies: [],
    difficulty: 2,
  },
  {
    name: 'trade-signal',
    displayName: 'Trade Signal',
    description: 'Generate trading signals (NOT execution)',
    category: ModuleCategory.ACTION,
    baseCost: 1.5,
    executionCost: 0.15,
    configSchema: {
      type: 'object',
      properties: {
        signalType: { type: 'string', enum: ['buy', 'sell', 'hold'], description: 'Signal type' },
        confidence: { type: 'number', minimum: 0, maximum: 100, description: 'Confidence level' },
      },
    },
    defaultConfig: { signalType: 'hold', confidence: 50 },
    dependencies: ['technical-indicators'],
    difficulty: 3,
  },
];

// Agent Templates - Pre-built configurations
const templates = [
  // BEGINNER TEMPLATES
  {
    name: 'Simple Price Tracker',
    description: 'Track cryptocurrency prices and get alerts when thresholds are crossed. Perfect for beginners!',
    category: AgentCategory.TRADING,
    difficulty: TemplateDifficulty.BEGINNER,
    basePrice: 1.5,
    complexity: 1,
    modules: {
      dataSources: ['price-feed'],
      analysis: [],
      triggers: ['price-threshold', 'time-interval'],
      actions: ['alert-notification'],
    },
    configSchema: {
      type: 'object',
      properties: {
        tradingPair: { 
          type: 'string', 
          description: 'Trading pair to track',
          default: 'BTC/USD',
        },
        priceThreshold: { 
          type: 'number', 
          description: 'Alert when price crosses this value',
        },
        direction: {
          type: 'string',
          enum: ['above', 'below'],
          description: 'Alert when price goes above or below threshold',
          default: 'above',
        },
        checkInterval: {
          type: 'string',
          enum: ['5m', '15m', '1h'],
          description: 'How often to check price',
          default: '15m',
        },
      },
      required: ['tradingPair', 'priceThreshold'],
    },
    defaultConfig: {
      tradingPair: 'BTC/USD',
      priceThreshold: 50000,
      direction: 'above',
      checkInterval: '15m',
    },
    exampleConfig: {
      tradingPair: 'ETH/USD',
      priceThreshold: 3000,
      direction: 'below',
      checkInterval: '5m',
    },
    featured: true,
  },
  {
    name: 'Social Sentiment Monitor',
    description: 'Monitor Twitter/X for cryptocurrency sentiment and trends. Get daily sentiment reports!',
    category: AgentCategory.SOCIAL,
    difficulty: TemplateDifficulty.BEGINNER,
    basePrice: 2.0,
    complexity: 2,
    modules: {
      dataSources: ['twitter-api'],
      analysis: ['sentiment-analysis'],
      triggers: ['time-interval'],
      actions: ['report-generation', 'alert-notification'],
    },
    configSchema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to track (e.g., Bitcoin, ETH, DeFi)',
          minItems: 1,
        },
        reportInterval: {
          type: 'string',
          enum: ['1h', '4h', '1d'],
          description: 'How often to generate reports',
          default: '1d',
        },
        sentimentThreshold: {
          type: 'number',
          minimum: -1,
          maximum: 1,
          description: 'Alert when sentiment crosses this threshold',
          default: 0.5,
        },
      },
      required: ['keywords'],
    },
    defaultConfig: {
      keywords: ['Bitcoin', 'Crypto'],
      reportInterval: '1d',
      sentimentThreshold: 0.5,
    },
    featured: true,
  },

  // INTERMEDIATE TEMPLATES
  {
    name: 'DEX Trading Signal Bot',
    description: 'Advanced trading signals based on DEX data, volume analysis, and technical indicators.',
    category: AgentCategory.TRADING,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    basePrice: 4.5,
    complexity: 3,
    modules: {
      dataSources: ['dex-api', 'price-feed'],
      analysis: ['technical-indicators', 'volume-analysis'],
      triggers: ['price-threshold', 'time-interval'],
      actions: ['trade-signal', 'alert-notification'],
    },
    configSchema: {
      type: 'object',
      properties: {
        tradingPairs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Trading pairs to analyze',
          minItems: 1,
        },
        dexes: {
          type: 'array',
          items: { type: 'string', enum: ['uniswap', 'sushiswap', 'curve'] },
          description: 'DEXs to monitor',
        },
        indicators: {
          type: 'array',
          items: { type: 'string', enum: ['RSI', 'MACD', 'EMA', 'BB'] },
          description: 'Technical indicators to use',
        },
        rsiThreshold: {
          type: 'object',
          properties: {
            oversold: { type: 'number', default: 30 },
            overbought: { type: 'number', default: 70 },
          },
        },
        minVolume: {
          type: 'number',
          description: 'Minimum 24h volume in USD',
        },
      },
      required: ['tradingPairs', 'indicators'],
    },
    defaultConfig: {
      tradingPairs: ['ETH/USDC'],
      dexes: ['uniswap'],
      indicators: ['RSI', 'MACD'],
      rsiThreshold: { oversold: 30, overbought: 70 },
      minVolume: 100000,
    },
    featured: true,
  },
  {
    name: 'On-Chain Activity Analyzer',
    description: 'Monitor blockchain events, whale movements, and smart contract interactions.',
    category: AgentCategory.ANALYTICS,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    basePrice: 5.0,
    complexity: 4,
    modules: {
      dataSources: ['onchain-data', 'dex-api'],
      analysis: ['volume-analysis'],
      triggers: ['event-based', 'time-interval'],
      actions: ['report-generation', 'alert-notification'],
    },
    configSchema: {
      type: 'object',
      properties: {
        chains: {
          type: 'array',
          items: { type: 'string', enum: ['ethereum', 'base', 'optimism', 'arbitrum'] },
          description: 'Blockchains to monitor',
        },
        contracts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Contract addresses to track',
        },
        events: {
          type: 'array',
          items: { type: 'string' },
          description: 'Event types to monitor',
        },
        minTransactionValue: {
          type: 'number',
          description: 'Minimum transaction value in USD',
        },
      },
      required: ['chains'],
    },
    defaultConfig: {
      chains: ['base'],
      contracts: [],
      events: ['Transfer', 'Swap'],
      minTransactionValue: 10000,
    },
  },

  // ADVANCED TEMPLATES
  {
    name: 'Multi-Strategy Trading System',
    description: 'Complex multi-strategy system combining sentiment, technicals, and on-chain data.',
    category: AgentCategory.TRADING,
    difficulty: TemplateDifficulty.ADVANCED,
    basePrice: 8.0,
    complexity: 5,
    modules: {
      dataSources: ['twitter-api', 'dex-api', 'onchain-data', 'price-feed'],
      analysis: ['sentiment-analysis', 'technical-indicators', 'volume-analysis'],
      triggers: ['price-threshold', 'event-based', 'time-interval'],
      actions: ['trade-signal', 'report-generation', 'alert-notification'],
    },
    configSchema: {
      type: 'object',
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              weight: { type: 'number', minimum: 0, maximum: 1 },
              enabled: { type: 'boolean' },
            },
          },
        },
        riskLevel: {
          type: 'string',
          enum: ['conservative', 'moderate', 'aggressive'],
          description: 'Risk tolerance level',
        },
        positionSize: {
          type: 'number',
          description: 'Max position size as % of portfolio',
        },
      },
    },
    defaultConfig: {
      strategies: [
        { name: 'sentiment-momentum', weight: 0.3, enabled: true },
        { name: 'technical-trend', weight: 0.4, enabled: true },
        { name: 'volume-breakout', weight: 0.3, enabled: true },
      ],
      riskLevel: 'moderate',
      positionSize: 10,
    },
    featured: true,
  },
];

async function main() {
  console.log('🌱 Seeding Agent Builder Templates & Modules...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing templates and modules...');
  await prisma.agentModule.deleteMany({});
  await prisma.agentTemplate.deleteMany({});
  
  // Seed modules
  console.log('\n📦 Creating agent modules...');
  for (const moduleData of modules) {
    const module = await prisma.agentModule.create({
      data: moduleData,
    });
    console.log(`   ✅ Created module: ${module.displayName} (${module.category})`);
  }

  // Seed templates
  console.log('\n📋 Creating agent templates...');
  for (const templateData of templates) {
    const template = await prisma.agentTemplate.create({
      data: templateData,
    });
    console.log(`   ✅ Created template: ${template.name} (${template.difficulty})`);
  }

  console.log('\n✨ Seeding complete!');
  console.log(`   📦 ${modules.length} modules created`);
  console.log(`   📋 ${templates.length} templates created`);
  console.log('\n🎯 Agent Builder is ready to use!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

