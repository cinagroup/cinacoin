/**
 * Unit tests for adapter-xrpl — XRPL operations service.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidClassicAddress,
  isValidXAddress,
  isValidAnyAddress,
  buildPaymentTx,
  buildIssuedPaymentTx,
  buildTrustSetTx,
  buildOfferCreateTx,
  buildOfferCancelTx,
  buildNFTMintTx,
  buildNFTBurnTx,
  buildNFTCreateOfferTx,
  buildAccountSetTx,
  dropsToXrp,
  xrpToDrops,
  buildAccountInfoRpc,
  buildAccountLinesRpc,
  buildLedgerRpc,
  parseAccountInfo,
  buildOrderBookRequest,
  buildSubmitRpc,
  TrustSetFlags,
  OfferCreateFlags,
  NFTokenMintFlags,
  AccountSetFlags,
} from './services/xrpl-ops.js';

describe('address validation', () => {
  it('should validate classic addresses', () => {
    expect(isValidClassicAddress('rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH')).toBe(true);
    expect(isValidClassicAddress('invalid')).toBe(false);
  });

  it('should validate X-addresses', () => {
    expect(isValidXAddress('XVLhHMPHU98es4dbozjVtdWzVrDQV3z8S5o3nUJe4SPj4Ca5S')).toBe(true);
    expect(isValidXAddress('invalid')).toBe(false);
  });

  it('should accept any valid address', () => {
    expect(isValidAnyAddress('rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH')).toBe(true);
    expect(isValidAnyAddress('XVLhHMPHU98es4dbozjVtdWzVrDQV3z8S5o3nUJe4SPj4Ca5S')).toBe(true);
    expect(isValidAnyAddress('invalid')).toBe(false);
  });
});

describe('buildPaymentTx', () => {
  it('should build a basic XRP payment', () => {
    const tx = buildPaymentTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      destination: 'rDN9oSXaUfB7k2L3k2x3k2x3k2x3k2x3k2',
      amount: '1000000',
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('Payment');
    expect(tx.Account).toBe('rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH');
    expect(tx.Amount).toBe('1000000');
    expect(tx.Fee).toBe('12');
    expect(tx.Sequence).toBe(1);
    expect(tx.LastLedgerSequence).toBe(1000);
  });

  it('should include destination tag when provided', () => {
    const tx = buildPaymentTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      destination: 'rDN9oSXaUfB7k2L3k2x3k2L3k2L3k2L3k2L3',
      amount: '1000000',
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
      destinationTag: 12345,
    });

    expect(tx.DestinationTag).toBe(12345);
  });

  it('should include memo when provided', () => {
    const tx = buildPaymentTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      destination: 'rDN9oSXaUfB7k2L3k2x3k2L3k2L3k2L3k2L3',
      amount: '1000000',
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
      memo: 'Hello',
    });

    expect(tx.Memos).toBeDefined();
    expect(tx.Memos).toHaveLength(1);
  });
});

describe('buildTrustSetTx', () => {
  it('should build a trust set transaction', () => {
    const tx = buildTrustSetTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      issuer: 'rIssuerAddress1234567890123456789012',
      currency: 'USD',
      limit: '1000',
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('TrustSet');
    expect((tx as any).LimitAmount.currency).toBe('USD');
    expect((tx as any).LimitAmount.value).toBe('1000');
  });
});

describe('buildOfferCreateTx', () => {
  it('should build an offer create transaction', () => {
    const tx = buildOfferCreateTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      takerGets: '1000000',
      takerPays: { value: '10', currency: 'USD', issuer: 'rIssuer1234567890123456789012' },
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('OfferCreate');
    expect((tx as any).TakerGets).toBe('1000000');
  });
});

describe('buildOfferCancelTx', () => {
  it('should build an offer cancel transaction', () => {
    const tx = buildOfferCancelTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      offerSequence: 5,
      fee: '12',
      sequence: 2,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('OfferCancel');
    expect((tx as any).OfferSequence).toBe(5);
  });
});

describe('buildNFTMintTx', () => {
  it('should build an NFT mint transaction', () => {
    const tx = buildNFTMintTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      nftokenTaxon: 0,
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('NFTokenMint');
  });

  it('should include URI and flags when provided', () => {
    const tx = buildNFTMintTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      nftokenTaxon: 1,
      uri: '68747470733A2F2F6578616D706C652E636F6D2F31',
      flags: NFTokenMintFlags.tfBurnable,
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.URI).toBe('68747470733A2F2F6578616D706C652E636F6D2F31');
    expect(tx.Flags).toBe(1);
  });
});

describe('buildNFTBurnTx', () => {
  it('should build an NFT burn transaction', () => {
    const tx = buildNFTBurnTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      nftokenId: '0000000000000000000000000000000000000000000000000000000000000001',
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('NFTokenBurn');
  });
});

describe('buildNFTCreateOfferTx', () => {
  it('should build an NFT sell offer', () => {
    const tx = buildNFTCreateOfferTx({
      account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
      nftokenId: '0000000000000000000000000000000000000000000000000000000000000001',
      amount: '1000000',
      isSellOffer: true,
      fee: '12',
      sequence: 1,
      lastLedgerSequence: 1000,
    });

    expect(tx.TransactionType).toBe('NFTokenCreateOffer');
    expect(tx.Flags).toBe(1);
  });
});

describe('dropsToXrp / xrpToDrops', () => {
  it('should convert drops to XRP', () => {
    expect(dropsToXrp('1000000')).toBe('1.000000');
    expect(dropsToXrp('500000')).toBe('0.500000');
    expect(dropsToXrp('12')).toBe('0.000012');
  });

  it('should convert XRP to drops', () => {
    expect(xrpToDrops('1')).toBe('1000000');
    expect(xrpToDrops('0.5')).toBe('500000');
    expect(xrpToDrops('100')).toBe('100000000');
  });
});

describe('RPC builders', () => {
  it('buildAccountInfoRpc should include strict mode', () => {
    const rpc = buildAccountInfoRpc('rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH');
    expect(rpc.command).toBe('account_info');
    expect(rpc.strict).toBe(true);
  });

  it('buildAccountLinesRpc should include peer when provided', () => {
    const rpc = buildAccountLinesRpc('rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH', 'rIssuer1234567890123456789012');
    expect(rpc.peer).toBe('rIssuer1234567890123456789012');
  });

  it('buildOrderBookRequest should build correctly', () => {
    const rpc = buildOrderBookRequest(
      { currency: 'XRP' },
      { currency: 'USD', issuer: 'rIssuer1234567890123456789012' },
    );
    expect(rpc.command).toBe('book_offers');
  });

  it('buildSubmitRpc should include tx_blob', () => {
    const rpc = buildSubmitRpc('120000...');
    expect(rpc.command).toBe('submit');
    expect(rpc.tx_blob).toBe('120000...');
  });
});

describe('parseAccountInfo', () => {
  it('should parse account data', () => {
    const result = parseAccountInfo({
      account_data: {
        Balance: '1000000',
        Sequence: 5,
        OwnerCount: 2,
        Flags: 0,
      },
    });

    expect(result.xrpBalance).toBe('1000000');
    expect(result.sequence).toBe(5);
    expect(result.ownerCount).toBe(2);
    expect(result.reserve).toBe('30000000'); // 20000000 + 2*5000000
  });
});

describe('flag enums', () => {
  it('TrustSetFlags should have correct values', () => {
    expect(TrustSetFlags.tfSetfAuth).toBe(0x00010000);
    expect(TrustSetFlags.tfNoRipple).toBe(0x00020000);
  });

  it('OfferCreateFlags should have correct values', () => {
    expect(OfferCreateFlags.tfPassive).toBe(0x00010000);
    expect(OfferCreateFlags.tfSell).toBe(0x00080000);
  });

  it('NFTokenMintFlags should have correct values', () => {
    expect(NFTokenMintFlags.tfTransferable).toBe(0x00000008);
  });

  it('AccountSetFlags should have correct values', () => {
    expect(AccountSetFlags.tfRequireDestTag).toBe(0x00010000);
  });
});
