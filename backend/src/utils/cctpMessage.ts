/**
 * CCTP burn-message decoding helpers.
 *
 * Amount and mint recipient MUST be derived from attested MessageSent bytes.
 * Never trust client-supplied amounts for credit application.
 *
 * Layout references:
 * - CCTP V1 message header: body at offset 116
 * - CCTP V2 message header: body at offset 148
 * - BurnMessage (V1/V2): amount at body+68, mintRecipient at body+36
 * - BurnMessageV2: feeExecuted at body+164 (minted = amount - feeExecuted)
 */

export const CCTP_V1_BODY_OFFSET = 116;
export const CCTP_V2_BODY_OFFSET = 148;
export const BURN_MINT_RECIPIENT_OFFSET = 36;
export const BURN_AMOUNT_OFFSET = 68;
export const BURN_V2_FEE_EXECUTED_OFFSET = 164;
export const BURN_V1_BODY_LENGTH = 132;
export const BURN_V2_BODY_LENGTH = 228;

export interface DecodedCctpBurn {
  messageVersion: number;
  amount: bigint;
  mintRecipient: `0x${string}`;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! << 24) |
    (bytes[offset + 1]! << 16) |
    (bytes[offset + 2]! << 8) |
    bytes[offset + 3]!
  ) >>> 0;
}

function readUint256(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 32; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]!);
  }
  return value;
}

function readAddressFromBytes32(bytes: Uint8Array, offset: number): `0x${string}` {
  // EVM addresses are right-aligned in bytes32 (12 zero bytes + 20 address bytes)
  const hex = Array.from(bytes.slice(offset + 12, offset + 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex message bytes');
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Decode burn amount and mint recipient from a CCTP MessageSent payload.
 */
export function decodeCctpBurnMessage(messageBytes: `0x${string}` | string): DecodedCctpBurn {
  const bytes = hexToBytes(messageBytes);
  if (bytes.length < CCTP_V1_BODY_OFFSET + BURN_V1_BODY_LENGTH) {
    throw new Error('CCTP message too short');
  }

  const messageVersion = readUint32(bytes, 0);
  const bodyOffset = messageVersion === 0 ? CCTP_V1_BODY_OFFSET : CCTP_V2_BODY_OFFSET;

  if (bytes.length < bodyOffset + BURN_V1_BODY_LENGTH) {
    throw new Error(`CCTP message body truncated for version ${messageVersion}`);
  }

  const mintRecipient = readAddressFromBytes32(bytes, bodyOffset + BURN_MINT_RECIPIENT_OFFSET);
  const burnedAmount = readUint256(bytes, bodyOffset + BURN_AMOUNT_OFFSET);

  let amount = burnedAmount;
  if (messageVersion !== 0) {
    if (bytes.length < bodyOffset + BURN_V2_BODY_LENGTH) {
      throw new Error('CCTP V2 burn message body truncated');
    }
    const feeExecuted = readUint256(bytes, bodyOffset + BURN_V2_FEE_EXECUTED_OFFSET);
    if (feeExecuted > burnedAmount) {
      throw new Error('CCTP V2 feeExecuted exceeds burn amount');
    }
    amount = burnedAmount - feeExecuted;
  }

  if (amount <= 0n) {
    throw new Error('Decoded CCTP burn amount must be greater than zero');
  }

  return { messageVersion, amount, mintRecipient };
}

/**
 * Normalize an address for equality checks.
 */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * Validate client-submitted credit metadata against the attested burn message.
 * Returns the authoritative credit amount from the message.
 */
export function assertCctpCreditRequest(params: {
  messageBytes: `0x${string}` | string;
  claimedAmount: string;
  receiverAddress: string;
}): { amount: bigint; mintRecipient: `0x${string}`; messageVersion: number } {
  const decoded = decodeCctpBurnMessage(params.messageBytes);

  let claimed: bigint;
  try {
    claimed = BigInt(params.claimedAmount);
  } catch {
    throw new Error('Invalid claimed CCTP amount');
  }

  if (claimed !== decoded.amount) {
    throw new Error(
      `Claimed CCTP amount ${claimed.toString()} does not match attested burn amount ${decoded.amount.toString()}`
    );
  }

  if (normalizeAddress(decoded.mintRecipient) !== normalizeAddress(params.receiverAddress)) {
    throw new Error(
      `CCTP mintRecipient ${decoded.mintRecipient} does not match receiver ${params.receiverAddress}`
    );
  }

  return decoded;
}
