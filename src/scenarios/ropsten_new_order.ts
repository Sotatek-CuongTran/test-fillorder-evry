import { Wallet, providers, Contract } from 'ethers';
import { ContractWrappers } from '@0x/contract-wrappers';
import { NETWORK_CONFIGS, MNEMONIC, TX_DEFAULTS } from '../configs';
import { providerEngine } from '../provider_engine';
import * as zeroExABI from '../zero-ex.json';
import { LimitOrder } from '@0x/protocol-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

async function scenarioAsync(): Promise<void> {
  const contractWrappers = new ContractWrappers(providerEngine, {
    chainId: NETWORK_CONFIGS.chainId,
  });
  const provider = new providers.JsonRpcProvider(NETWORK_CONFIGS.rpcUrl);
  const maker = Wallet.fromMnemonic(MNEMONIC).connect(provider);
  const taker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/1").connect(
    provider
  );

  const web3Wrapper = new Web3Wrapper(providerEngine);
  const accounts = await web3Wrapper.getAvailableAddressesAsync();
  console.log({ maker: [accounts[0]] });

  const newOrder = new LimitOrder({
    takerTokenFeeAmount: new BigNumber(0),
    sender: '0x0000000000000000000000000000000000000000',
    feeRecipient: '0x0000000000000000000000000000000000000000',
    makerToken: '0xad6d458402f60fd3bd25163575031acdce07538d', // DAI
    takerToken: contractWrappers.contractAddresses.etherToken,
    makerAmount: new BigNumber('100000000000000000000'),
    takerAmount: new BigNumber('100000000000000000'), //0.1
    maker: '0xb1b11e04348f4271b163db51138704f3dec0c128',
    taker: '0x0000000000000000000000000000000000000000',
    pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
    expiry: new BigNumber(1621584020),
    salt: new BigNumber(
      '4427581533300995228973896243299476230622882969229644628675279848100164573266'
    ),
    chainId: NETWORK_CONFIGS.chainId,
    verifyingContract: contractWrappers.contractAddresses.exchangeProxy,
  });
  console.log({ newOrder });
  console.log({ orderHash: newOrder.getHash() });

  // signature
  // const sig = await newOrder.getSignatureWithProviderAsync(
  //   providerEngine,
  //   SignatureType.EthSign,
  //   maker.address
  // );
  const sig = await newOrder.getSignatureWithKey(
    '0x1221957361a0c6f0236ae7056d3f42b83316fb98731b04d9d243e0cc4562fb1e'
  );
  console.log(sig);

  const zeroEx = new Contract(
    contractWrappers.contractAddresses.exchangeProxy,
    zeroExABI,
    maker
  );

  // const info = await zeroEx.getLimitOrderInfo(
  //   JSON.parse(JSON.stringify(newOrder))
  // );
  // console.log({ info });

  const fillable = await zeroEx.getLimitOrderRelevantState(
    JSON.parse(JSON.stringify(newOrder)),
    sig
  );
  console.log({ fillable });

  const test = await zeroEx.getLimitOrderRelevantState(
    {
      sender: '0x0000000000000000000000000000000000000000',
      maker: '0xb1b11e04348f4271b163db51138704f3dec0c128',
      taker: '0x0000000000000000000000000000000000000000',
      takerTokenFeeAmount: 0,
      makerAmount: '100000000000000000000',
      takerAmount: '100000000000000000',
      makerToken: '0xad6d458402f60fd3bd25163575031acdce07538d',
      takerToken: '0xc778417e063141139fce010982780140aa0cd5ab',
      salt: '4427581533300995228973896243299476230622882969229644628675279848100164573266',
      verifyingContract: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      feeRecipient: '0x0000000000000000000000000000000000000000',
      expiry: '1621584020',
      chainId: 3,
      pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      signatureType: 3,
      r: '0xeccacd379eafbe9b2ef0c6234ad8ccf649325ae0e9d6f9a8fd05814021606c03',
      s: '0x1394792141e2af0dc335241c753fde983f0e45f6337cb573873f24d6e9d1ce36',
      v: 28,
    }
  );
  console.log(JSON.stringify(test, null, 2));
}

scenarioAsync()
  .then(() => console.log('Done!!!'))
  .catch(console.error);
