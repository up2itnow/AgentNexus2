/**
 * Google Agent Payments Protocol (AP2) Types
 * Based on official source code (src/ap2/types/mandate.py, payment_request.py)
 */

// --- Payment Request API (W3C) ---

export interface PaymentCurrencyAmount {
    currency: string; // ISO 4217
    value: number;
}

export interface PaymentItem {
    label: string;
    amount: PaymentCurrencyAmount;
    pending?: boolean;
    refund_period?: number; // Default 30
}

export interface PaymentShippingOption {
    id: string;
    label: string;
    amount: PaymentCurrencyAmount;
    selected?: boolean;
}

export interface PaymentMethodData {
    supported_methods: string;
    data?: Record<string, any>;
}

export interface PaymentDetailsModifier {
    supported_methods: string;
    total?: PaymentItem;
    additional_display_items?: PaymentItem[];
    data?: any;
}

export interface PaymentDetailsInit {
    id: string;
    display_items: PaymentItem[];
    shipping_options?: PaymentShippingOption[];
    modifiers?: PaymentDetailsModifier[];
    total: PaymentItem;
}

export interface PaymentOptions {
    request_payer_name?: boolean;
    request_payer_email?: boolean;
    request_payer_phone?: boolean;
    request_shipping?: boolean;
    shipping_type?: 'shipping' | 'delivery' | 'pickup';
}

export interface ContactAddress {
    // Simplified for now
    country?: string;
    addressLine?: string[];
    region?: string;
    city?: string;
    dependentLocality?: string;
    postalCode?: string;
    sortingCode?: string;
    organization?: string;
    recipient?: string;
    phone?: string;
}

export interface PaymentRequest {
    method_data: PaymentMethodData[];
    details: PaymentDetailsInit;
    options?: PaymentOptions;
    shipping_address?: ContactAddress;
}

export interface PaymentResponse {
    request_id: string;
    method_name: string;
    details?: Record<string, any>;
    shipping_address?: ContactAddress;
    shipping_option?: PaymentShippingOption;
    payer_name?: string;
    payer_email?: string;
    payer_phone?: string;
}

// --- AP2 Mandates ---

export interface IntentMandate {
    user_cart_confirmation_required: boolean;
    natural_language_description: string;
    merchants?: string[];
    skus?: string[];
    requires_refundability?: boolean;
    intent_expiry: string; // ISO 8601
}

export interface CartContents {
    id: string;
    user_cart_confirmation_required: boolean;
    payment_request: PaymentRequest;
    cart_expiry: string; // ISO 8601
    merchant_name: string;
}

export interface CartMandate {
    contents: CartContents;
    merchant_authorization?: string; // JWT
}

export interface PaymentMandateContents {
    payment_mandate_id: string;
    payment_details_id: string;
    payment_details_total: PaymentItem;
    payment_response: PaymentResponse;
    merchant_agent: string;
    timestamp: string; // ISO 8601
}

export interface PaymentMandate {
    payment_mandate_contents: PaymentMandateContents;
    user_authorization?: string; // Verifiable Credential (SD-JWT)
}
