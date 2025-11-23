import {
    IntentMandate,
    CartMandate,
    PaymentMandate,
    CartContents,
    PaymentMandateContents,
    PaymentRequest,
    PaymentItem
} from '../../types/ap2';
import { ethers } from 'ethers';

export class AP2Service {

    /**
     * Create an Intent Mandate to initiate a purchase
     */
    createIntent(description: string, expiryMinutes: number = 60): IntentMandate {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + expiryMinutes);

        return {
            user_cart_confirmation_required: true,
            natural_language_description: description,
            intent_expiry: expiry.toISOString(),
        };
    }

    /**
     * Create a Cart Mandate (Merchant side)
     */
    async createCart(
        intent: IntentMandate,
        items: PaymentItem[],
        merchantName: string,
        merchantSigner: ethers.Wallet
    ): Promise<CartMandate> {

        const totalValue = items.reduce((sum, item) => sum + item.amount.value, 0);
        const currency = items[0]?.amount.currency || 'ETH';

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 30); // 30 min cart expiry

        const paymentRequest: PaymentRequest = {
            method_data: [{ supported_methods: 'https://agentnexus.io/payment' }],
            details: {
                id: crypto.randomUUID(),
                display_items: items,
                total: {
                    label: 'Total',
                    amount: { currency, value: totalValue }
                }
            }
        };

        const contents: CartContents = {
            id: crypto.randomUUID(),
            user_cart_confirmation_required: intent.user_cart_confirmation_required,
            payment_request: paymentRequest,
            cart_expiry: expiry.toISOString(),
            merchant_name: merchantName
        };

        // Simulate JWT signing
        const signature = await merchantSigner.signMessage(JSON.stringify(contents));
        // In reality, this would be a proper JWT
        const jwt = `eyJhbGciOiJFUzI1NiJ9.${Buffer.from(JSON.stringify(contents)).toString('base64')}.${signature}`;

        return {
            contents,
            merchant_authorization: jwt,
        };
    }

    /**
     * Create a Payment Mandate (Buyer side)
     */
    async createPayment(
        cart: CartMandate,
        buyerSigner: ethers.Wallet
    ): Promise<PaymentMandate> {

        const contents: PaymentMandateContents = {
            payment_mandate_id: crypto.randomUUID(),
            payment_details_id: cart.contents.payment_request.details.id,
            payment_details_total: cart.contents.payment_request.details.total,
            payment_response: {
                request_id: cart.contents.payment_request.details.id,
                method_name: 'https://agentnexus.io/payment',
                details: { transaction_hash: '0x...' } // Placeholder
            },
            merchant_agent: cart.contents.merchant_name,
            timestamp: new Date().toISOString()
        };

        // Simulate VC/SD-JWT signing
        const signature = await buyerSigner.signMessage(JSON.stringify(contents));
        const vc = `eyJhbGciOiJFUzI1NiJ9.${Buffer.from(JSON.stringify(contents)).toString('base64')}.${signature}`;

        return {
            payment_mandate_contents: contents,
            user_authorization: vc,
        };
    }
}
