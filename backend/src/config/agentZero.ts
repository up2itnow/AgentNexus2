import { AgentZeroConfig } from '../types/agentZero';

export const agentZeroConfig: AgentZeroConfig = {
    basicTokenId: process.env.AGENT_ZERO_BASIC_TOKEN_ID || '',
    proTokenId: process.env.AGENT_ZERO_PRO_TOKEN_ID || '',
    proPrice: BigInt(process.env.AGENT_ZERO_PRO_PRICE || '50000000'),
    proPriceToken: 'USDC',
    quickImage: process.env.AGENT_ZERO_QUICK_IMAGE || 'agentnexus/agent-zero-quick:latest',
    fullImage: process.env.AGENT_ZERO_FULL_IMAGE || 'agentnexus/agent-zero-full:latest',
    basicRateLimit: parseInt(process.env.AGENT_ZERO_BASIC_RATE_LIMIT || '10'),
    basicTimeout: parseInt(process.env.AGENT_ZERO_BASIC_TIMEOUT || '300000'),
    proTimeout: parseInt(process.env.AGENT_ZERO_PRO_TIMEOUT || '1800000'),
    proMaxMemory: process.env.AGENT_ZERO_PRO_MAX_MEMORY || '4GB',
    proCpuLimit: '2.0',
};
