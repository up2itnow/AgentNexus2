import { generatePaymentRequest } from '../src/middleware/x402';
import { X402MiddlewareConfig } from '../src/types/x402-types';

describe('x402 CCTP Route Generation', () => {
    const mockConfig: X402MiddlewareConfig = {
        enabled: true,
        facilitator: {
            url: 'https://pay.agentnexus.xyz',
            network: 'base-sepolia',
            recipientAddress: '0x1234567890123456789012345678901234567890',
            maxPaymentUsdc: 10,
            paymentTimeout: 300
        },
        protectedEndpoints: []
    };

    const mockEndpoint = {
        method: 'GET',
        path: '/test',
        priceUsdc: '1.0',
        description: 'Test resource'
    };

    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('Should generate single route when CCTP is disabled', () => {
        process.env.ENABLE_CCTP_ROUTES = 'false';

        const request = generatePaymentRequest(mockEndpoint, mockConfig);

        expect(request.routes).toBeUndefined();
        expect(request.token).toBeDefined();
        expect(request.chainId).toBe('eip155:84532'); // Base Sepolia
    });

    test('Should generate 3 routes when CCTP is enabled', () => {
        process.env.ENABLE_CCTP_ROUTES = 'true';
        // Mock receiver contract
        process.env.CCTP_BASE_RECEIVER_CONTRACT = '0xReceiver';

        const request = generatePaymentRequest(mockEndpoint, mockConfig);

        expect(request.routes).toBeDefined();
        expect(request.routes?.length).toBe(3);

        const baseRoute = request.routes![0];
        const opRoute = request.routes![1];
        const arbRoute = request.routes![2];

        // 1. Base Direct
        expect(baseRoute.id).toBe('base_direct_usdc');
        expect(baseRoute.destinationChain).toBe('eip155:84532');
        expect(baseRoute.settlement).toBeUndefined();

        // 2. Optimism CCTP
        expect(opRoute.id).toBe('optimism_cctp_to_base');
        expect(opRoute.sourceChain).toBe('eip155:11155420'); // OP Sepolia
        expect(opRoute.settlement?.type).toBe('cctp');
        expect(opRoute.settlement?.destinationReceiver).toBe('0xReceiver');

        // 3. Arbitrum CCTP
        expect(arbRoute.id).toBe('arbitrum_cctp_to_base');
        expect(arbRoute.sourceChain).toBe('eip155:421614'); // Arb Sepolia
        expect(arbRoute.settlement?.type).toBe('cctp');
    });

    test('Should handle mainnet config correctly', () => {
        process.env.ENABLE_CCTP_ROUTES = 'true';
        const mainnetConfig = {
            ...mockConfig,
            facilitator: { ...mockConfig.facilitator, network: 'base' as const }
        };

        const request = generatePaymentRequest(mockEndpoint, mainnetConfig);

        const opRoute = request.routes![1];
        const arbRoute = request.routes![2];

        expect(opRoute.sourceChain).toBe('eip155:10'); // OP Mainnet
        expect(arbRoute.sourceChain).toBe('eip155:42161'); // Arb Mainnet
    });
});
