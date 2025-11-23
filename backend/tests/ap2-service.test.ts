import { AP2Service } from '../src/services/transactions/AP2Service';
import { ethers } from 'ethers';
import { PaymentItem } from '../src/types/ap2';

describe('AP2Service', () => {
    let ap2Service: AP2Service;
    let merchantWallet: ethers.HDNodeWallet;
    let buyerWallet: ethers.HDNodeWallet;

    beforeAll(() => {
        ap2Service = new AP2Service();
        merchantWallet = ethers.Wallet.createRandom();
        buyerWallet = ethers.Wallet.createRandom();
    });

    it('should create a valid IntentMandate', () => {
        const description = 'Test Purchase';
        const intent = ap2Service.createIntent(description);

        expect(intent.natural_language_description).toBe(description);
        expect(intent.user_cart_confirmation_required).toBe(true);
        expect(intent.intent_expiry).toBeDefined();
    });

    it('should create a valid CartMandate', async () => {
        const intent = ap2Service.createIntent('Test Purchase');
        const items: PaymentItem[] = [
            {
                label: 'Service Fee',
                amount: { currency: 'ETH', value: 0.01 }
            }
        ];

        const cart = await ap2Service.createCart(intent, items, 'Test Merchant', merchantWallet as any);

        expect(cart.contents.merchant_name).toBe('Test Merchant');
        expect(cart.contents.payment_request.details.total.amount.value).toBe(0.01);
        expect(cart.merchant_authorization).toBeDefined();

        // Verify JWT structure (mocked)
        const parts = cart.merchant_authorization!.split('.');
        expect(parts.length).toBe(3);
    });

    it('should create a valid PaymentMandate', async () => {
        const intent = ap2Service.createIntent('Test Purchase');
        const items: PaymentItem[] = [
            {
                label: 'Service Fee',
                amount: { currency: 'ETH', value: 0.01 }
            }
        ];
        const cart = await ap2Service.createCart(intent, items, 'Test Merchant', merchantWallet as any);

        const payment = await ap2Service.createPayment(cart, buyerWallet as any);

        expect(payment.payment_mandate_contents.payment_details_total.amount.value).toBe(0.01);
        expect(payment.user_authorization).toBeDefined();

        // Verify VC structure (mocked)
        const parts = payment.user_authorization!.split('.');
        expect(parts.length).toBe(3);
    });
});
