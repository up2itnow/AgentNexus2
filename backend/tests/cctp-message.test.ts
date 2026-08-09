import {
  assertCctpCreditRequest,
  decodeCctpBurnMessage,
  CCTP_V1_BODY_OFFSET,
  BURN_V1_BODY_LENGTH,
} from '../src/utils/cctpMessage';

function encodeUint32(value: number): string {
  return value.toString(16).padStart(8, '0');
}

function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, '0');
}

function encodeAddressAsBytes32(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, '');
  if (hex.length !== 40) throw new Error('expected 20-byte address');
  return hex.padStart(64, '0');
}

/** Build a minimal CCTP V1 MessageSent payload with a BurnMessage body. */
function buildV1Message(params: {
  amount: bigint;
  mintRecipient: string;
}): `0x${string}` {
  const header =
    encodeUint32(0) + // version
    encodeUint32(3) + // sourceDomain
    encodeUint32(6) + // destinationDomain
    '0000000000000001' + // nonce uint64
    '11'.repeat(32) + // sender
    '22'.repeat(32) + // recipient
    '00'.repeat(32); // destinationCaller

  const body =
    encodeUint32(0) + // burn version
    encodeAddressAsBytes32('0xaf88d065e77c8cC2239327C5EDb3A432268e5831') + // burnToken
    encodeAddressAsBytes32(params.mintRecipient) +
    encodeUint256(params.amount) +
    encodeAddressAsBytes32('0x1111111111111111111111111111111111111111'); // messageSender

  const hex = header + body;
  expect(hex.length / 2).toBe(CCTP_V1_BODY_OFFSET + BURN_V1_BODY_LENGTH);
  return `0x${hex}`;
}

describe('CCTP message decoding', () => {
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  test('decodes attested burn amount and mint recipient from V1 message', () => {
    const amount = 1_000_000n;
    const message = buildV1Message({ amount, mintRecipient: receiver });

    const decoded = decodeCctpBurnMessage(message);
    expect(decoded.messageVersion).toBe(0);
    expect(decoded.amount).toBe(amount);
    expect(decoded.mintRecipient.toLowerCase()).toBe(receiver.toLowerCase());
  });

  test('rejects claimed amount that does not match attested burn', () => {
    const message = buildV1Message({
      amount: 1_000_000n,
      mintRecipient: receiver,
    });

    expect(() =>
      assertCctpCreditRequest({
        messageBytes: message,
        claimedAmount: '999999999999',
        receiverAddress: receiver,
      })
    ).toThrow(/does not match attested burn amount/);
  });

  test('rejects mintRecipient that is not the configured receiver', () => {
    const message = buildV1Message({
      amount: 1_000_000n,
      mintRecipient: '0x2222222222222222222222222222222222222222',
    });

    expect(() =>
      assertCctpCreditRequest({
        messageBytes: message,
        claimedAmount: '1000000',
        receiverAddress: receiver,
      })
    ).toThrow(/does not match receiver/);
  });

  test('accepts matching claimed amount and receiver', () => {
    const message = buildV1Message({
      amount: 5_000_000n,
      mintRecipient: receiver,
    });

    const decoded = assertCctpCreditRequest({
      messageBytes: message,
      claimedAmount: '5000000',
      receiverAddress: receiver,
    });

    expect(decoded.amount).toBe(5_000_000n);
  });
});
