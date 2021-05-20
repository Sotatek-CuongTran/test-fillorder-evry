import { Wallet, providers, BigNumber as BN, utils, Contract } from 'ethers';
import {
  ContractWrappers,
  ERC20TokenContract,
  OrderStatus,
} from '@0x/contract-wrappers';
import {
  generatePseudoRandomSalt,
  Order,
  signatureUtils,
} from '@0x/order-utils';
import { parseSignatureHexAsVRS } from '@0x/order-utils/lib/src/signature_utils';
import { NETWORK_CONFIGS, MNEMONIC, TX_DEFAULTS } from '../configs';
import { providerEngine } from '../provider_engine';
import {
  DECIMALS,
  NULL_ADDRESS,
  NULL_BYTES,
  UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
  ZERO,
} from '../constants';
import { calculateProtocolFee, getRandomFutureDateInSeconds } from '../utils';
import BigNumber from 'bignumber.js';
import * as exchangeABI from '../abi.json';
import * as zeroExABI from '../zero-ex.json';

async function scenarioAsync(): Promise<void> {
  const contractWrappers = new ContractWrappers(providerEngine, {
    chainId: NETWORK_CONFIGS.chainId,
  });
  const provider = new providers.JsonRpcProvider(NETWORK_CONFIGS.rpcUrl);
  const maker = Wallet.fromMnemonic(MNEMONIC).connect(provider);
  const taker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/1").connect(
    provider
  );

  // Generate the order hash and sign it
  const signedOrder = {
    chainId: 3,
    exchangeAddress: '0x5d8c9ba74607d2cbc4176882a42d4ace891c1c00',
    makerAddress: '0xb1b11e04348f4271b163db51138704f3dec0c128',
    takerAddress: '0x0000000000000000000000000000000000000000',
    senderAddress: '0x0000000000000000000000000000000000000000',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    expirationTimeSeconds: '1621564304',
    salt: '4427581533300995228973896243299476230622882969229644628675279848100164573266',
    makerAssetAmount: '1000000000000000000000',
    takerAssetAmount: '1000000000000000000',
    makerAssetData:
      '0xf47261b0000000000000000000000000ad6d458402f60fd3bd25163575031acdce07538d',
    takerAssetData:
      '0xf47261b0000000000000000000000000c778417e063141139fce010982780140aa0cd5ab',
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    makerFee: 0,
    takerFee: 0,
    signature:
      '0x1bb549d42097165f6d4d0ecece0046516f7e51117bcc0bb80ae1a506bb047ee80430d316167bdf01b6e8bd7a7640f6d7c6ed381ec1ddf64234df7eecc1e75ab60602',
  };
  console.log({ signedOrder });

  const exchange = new Contract(
    contractWrappers.contractAddresses.exchange,
    exchangeABI,
    taker
  );
  const orderInfo = await exchange.getOrderInfo(
    JSON.parse(JSON.stringify(signedOrder))
  );
  console.log(orderInfo);
  const vrs = parseSignatureHexAsVRS(signedOrder.signature);
  console.log({ vrs });

  const zeroEx = new Contract(
    contractWrappers.contractAddresses.exchangeProxy,
    zeroExABI,
    taker
  );
  const fillable = await zeroEx.getLimitOrderRelevantState(
    {
      makerToken: '0xad6d458402f60fd3bd25163575031acdce07538d',
      takerToken: contractWrappers.contractAddresses.etherToken,
      makerAmount: signedOrder.makerAssetAmount,
      takerAmount: signedOrder.takerAssetAmount,
      takerTokenFeeAmount: 0,
      maker: signedOrder.makerAddress,
      taker: signedOrder.takerAddress,
      sender: signedOrder.senderAddress,
      feeRecipient: signedOrder.feeRecipientAddress,
      pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
      expiry: signedOrder.expirationTimeSeconds,
      salt: signedOrder.salt,
    },
    {
      ...vrs,
      signatureType: 3,
    }
  );
  console.log({ fillable });
}

scenarioAsync()
  .then(() => console.log('Done!!!'))
  .catch(console.error);
