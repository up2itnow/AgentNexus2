/**
 * Database Seed Script
 * 
 * Populates the database with sample agents for development and testing
 * 
 * @author AgentNexus Team
 * @version 1.0.0
 */

import { PrismaClient, AgentCategory, AgentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const sampleAgents = [
  {
    name: 'Market Analyzer Pro',
    description: 'Advanced AI agent that analyzes cryptocurrency market trends using technical indicators, sentiment analysis, and on-chain data. Provides actionable insights for trading decisions.',
    category: AgentCategory.ANALYTICS,
    price: 2.5,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/market-analyzer:v1',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Trading pair symbol (e.g., BTC/USD)' },
        timeframe: { type: 'string', enum: ['1h', '4h', '1d', '1w'], description: 'Analysis timeframe' },
        indicators: { type: 'array', items: { type: 'string' }, description: 'Technical indicators to use' },
      },
      required: ['symbol', 'timeframe'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        trend: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
        confidence: { type: 'number', description: 'Confidence score 0-100' },
        signals: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'string' },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'DeFi Yield Optimizer',
    description: 'Automated yield farming optimizer that finds the best APY opportunities across multiple DeFi protocols. Supports Base, Ethereum, and other EVM chains.',
    category: AgentCategory.DEFI,
    price: 5.0,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/defi-optimizer:v1',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount to invest in USD' },
        riskTolerance: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Risk tolerance level' },
        chains: { type: 'array', items: { type: 'string' }, description: 'Blockchain networks to search' },
      },
      required: ['amount', 'riskTolerance'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        estimatedApy: { type: 'number' },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'NFT Rarity Scanner',
    description: 'Analyzes NFT collections to determine rarity scores, floor prices, and investment potential. Supports OpenSea, Blur, and other major marketplaces.',
    category: AgentCategory.NFT,
    price: 1.5,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/nft-scanner:v1',
    inputSchema: {
      type: 'object',
      properties: {
        collectionAddress: { type: 'string', description: 'NFT collection contract address' },
        tokenId: { type: 'string', description: 'Specific token ID (optional)' },
        marketplace: { type: 'string', enum: ['opensea', 'blur', 'looksrare'], description: 'Marketplace to check' },
      },
      required: ['collectionAddress'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        rarityScore: { type: 'number' },
        rarityRank: { type: 'number' },
        floorPrice: { type: 'number' },
        traits: { type: 'array', items: { type: 'object' } },
        valuation: { type: 'object' },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'Social Sentiment Tracker',
    description: 'Monitors social media platforms (Twitter, Reddit, Discord) for cryptocurrency sentiment. Uses NLP to gauge community mood and detect trending topics.',
    category: AgentCategory.SOCIAL,
    price: 3.0,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/sentiment-tracker:v1',
    inputSchema: {
      type: 'object',
      properties: {
        keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords to track' },
        platforms: { type: 'array', items: { type: 'string' }, description: 'Social platforms to monitor' },
        timeRange: { type: 'string', enum: ['1h', '6h', '24h', '7d'], description: 'Time range for analysis' },
      },
      required: ['keywords'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        overallSentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        sentimentScore: { type: 'number', description: 'Score from -100 to 100' },
        trendingTopics: { type: 'array', items: { type: 'string' } },
        mentions: { type: 'number' },
        keyInfluencers: { type: 'array', items: { type: 'object' } },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'Smart Contract Auditor',
    description: 'Automated smart contract security analysis tool. Detects common vulnerabilities, gas optimizations, and best practice violations.',
    category: AgentCategory.UTILITY,
    price: 10.0,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/contract-auditor:v1',
    inputSchema: {
      type: 'object',
      properties: {
        contractAddress: { type: 'string', description: 'Contract address to audit' },
        sourceCode: { type: 'string', description: 'Solidity source code (if not verified)' },
        network: { type: 'string', enum: ['ethereum', 'base', 'polygon'], description: 'Blockchain network' },
      },
      required: ['contractAddress'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        gasOptimizations: { type: 'array', items: { type: 'object' } },
        securityScore: { type: 'number', description: 'Score from 0-100' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'Portfolio Rebalancer',
    description: 'Automatically rebalances your cryptocurrency portfolio based on target allocations and market conditions. Supports multiple strategies.',
    category: AgentCategory.TRADING,
    price: 7.5,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/portfolio-rebalancer:v1',
    inputSchema: {
      type: 'object',
      properties: {
        portfolio: { type: 'object', description: 'Current portfolio holdings' },
        targetAllocations: { type: 'object', description: 'Target percentage per asset' },
        strategy: { type: 'string', enum: ['threshold', 'periodic', 'momentum'], description: 'Rebalancing strategy' },
      },
      required: ['portfolio', 'targetAllocations'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        rebalancingPlan: { type: 'array', items: { type: 'object' } },
        estimatedCost: { type: 'number' },
        expectedReturn: { type: 'number' },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'Gas Price Predictor',
    description: 'Machine learning model that predicts optimal gas prices for Ethereum and L2s. Helps users save on transaction costs.',
    category: AgentCategory.UTILITY,
    price: 0.5,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/gas-predictor:v1',
    inputSchema: {
      type: 'object',
      properties: {
        network: { type: 'string', enum: ['ethereum', 'base', 'optimism', 'arbitrum'], description: 'Network' },
        priority: { type: 'string', enum: ['slow', 'standard', 'fast'], description: 'Transaction priority' },
      },
      required: ['network'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        currentGasPrice: { type: 'number' },
        predictedGasPrice: { type: 'number' },
        recommendation: { type: 'string' },
        estimatedWaitTime: { type: 'number', description: 'Estimated time in minutes' },
      },
    },
    status: AgentStatus.ACTIVE,
  },
  {
    name: 'Token Launch Detector',
    description: 'Real-time detection of new token launches across DEXs. Analyzes liquidity, contract safety, and potential risks.',
    category: AgentCategory.TRADING,
    price: 4.0,
    developer: 'AgentNexus Team',
    developerWallet: '0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41',
    dockerImage: 'agentnexus/launch-detector:v1',
    inputSchema: {
      type: 'object',
      properties: {
        dexes: { type: 'array', items: { type: 'string' }, description: 'DEXs to monitor' },
        minLiquidity: { type: 'number', description: 'Minimum liquidity in USD' },
        chains: { type: 'array', items: { type: 'string' }, description: 'Blockchain networks' },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        newTokens: { type: 'array', items: { type: 'object' } },
        safetyScore: { type: 'number' },
        liquidityAnalysis: { type: 'object' },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
    status: AgentStatus.ACTIVE,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing agents
  console.log('🗑️  Clearing existing agents...');
  await prisma.agent.deleteMany({});

  // Create sample agents
  console.log('📦 Creating sample agents...');
  for (const agentData of sampleAgents) {
    const agent = await prisma.agent.create({
      data: agentData,
    });
    console.log(`   ✅ Created: ${agent.name} (${agent.category})`);
  }

  console.log(`\n✨ Seeded ${sampleAgents.length} agents successfully!`);
  console.log('🎯 Marketplace is ready to use!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

