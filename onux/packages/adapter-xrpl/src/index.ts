/**
 * @cinacoin/adapter-xrpl
 *
 * XRP Ledger chain adapter for Cinacoin — Xaman (formerly Xumm), Fireblocks, Ledger
 */

export { XrplAdapter, announceXrplProviders } from './XrplAdapter.js';
export { XamanConnector, announceXamanEIP6963 } from './connectors/xaman.js';

export type {
  XrplNetwork, XrplFeature, XrplPlatform, XrplProvider,
  XrplConnectorEvents, XrplConnectionResult, XrpSendParams,
  AccountSettingsParams, TrustLineParams, NftMintParams,
  NftBurnParams, XrplConnector, XrplConnectorRegistry,
  EIP6963XrplProviderDetail,
} from './types.js';

// XRPL operations service
export {
  isValidClassicAddress, isValidXAddress, isValidAnyAddress,
  buildPaymentTx, buildIssuedPaymentTx,
  buildTrustSetTx, buildOfferCreateTx, buildOfferCancelTx,
  buildNFTMintTx, buildNFTBurnTx, buildNFTCreateOfferTx, buildNFTCancelOfferTx,
  buildAccountSetTx,
  buildSubmitRpc, buildSignRpc,
  buildAccountInfoRpc, buildAccountLinesRpc, buildAccountOffersRpc,
  buildServerInfoRpc, buildLedgerRpc, buildOrderBookRequest,
  parseAccountInfo,
  dropsToXrp, xrpToDrops,
  buildRpcUrl,
  submitViaRpc, preparePaymentViaRpc, prepareTrustSetViaRpc,
  prepareOfferCreateViaRpc, getOrderBookViaRpc,
  getAccountInfoViaRpc, getTrustLinesViaRpc, getAccountOffersViaRpc,
  getServerInfoViaRpc, getLedgerViaRpc,
  XRPL_REST_URLS, XRPL_WS_URLS,
  XRP_DROPS, BASE_RESERVE, OWNER_RESERVE, DEFAULT_FEE,
  type XrplClassicAddress, type XrplXAddress,
  type XrplTransaction, type XrplTransactionType,
  type SignedTransaction, type SubmitResult,
  type XrplRpcResult, type XrplSubmitResult,
  TrustSetFlags, OfferCreateFlags, NFTokenMintFlags, AccountSetFlags,
} from './services/xrpl-ops.js';
