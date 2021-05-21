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

async function scenarioAsync(): Promise<void> {
  console.log('Fill Order');

  const provider = new providers.JsonRpcProvider(NETWORK_CONFIGS.rpcUrl);
  console.log({ blockNumber: await provider.getBlockNumber() });

  const maker = Wallet.fromMnemonic(MNEMONIC).connect(provider);
  const taker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/1").connect(
    provider
  );

  // Initialize the ContractWrappers, this provides helper functions around calling
  // 0x contracts as well as ERC20/ERC721 token contracts on the blockchain
  const contractWrappers = new ContractWrappers(providerEngine, {
    chainId: NETWORK_CONFIGS.chainId,
  });
  console.log(contractWrappers.contractAddresses);

  const zrxTokenAddress = contractWrappers.contractAddresses.zrxToken;
  const etherTokenAddress = contractWrappers.contractAddresses.etherToken;
  console.log({ maker, taker });

  const makerAssetAmount = utils.parseUnits('5', DECIMALS);
  const takerAssetAmount = utils.parseUnits('0.1', DECIMALS);
  const makerAssetData = await contractWrappers.devUtils
    .encodeERC20AssetData(zrxTokenAddress)
    .callAsync();
  const takerAssetData = await contractWrappers.devUtils
    .encodeERC20AssetData(etherTokenAddress)
    .callAsync();

  const erc20ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint amount) returns (boolean)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function deposit() public payable',
  ];

  // Allow the 0x ERC20 Proxy to move ZRX on behalf of makerAccount
  const zrxToken = new Contract(zrxTokenAddress, erc20ABI, maker);
  const makerZRXApprovalTxHash = await zrxToken.approve(
    contractWrappers.contractAddresses.erc20Proxy,
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS
  );
  console.log({ makerZRXApprovalTxHash });

  // Allow the 0x ERC20 Proxy to move WETH on behalf of takerAccount
  const etherToken = new Contract(
    contractWrappers.weth9.address,
    erc20ABI,
    taker
  );
  const takerWETHApprovalTxHash = await etherToken.approve(
    contractWrappers.contractAddresses.erc20Proxy,
    UNLIMITED_ALLOWANCE_IN_BASE_UNITS
  );
  console.log({ takerWETHApprovalTxHash });

  // Convert ETH into WETH for taker by depositing ETH into the WETH contract
  const takerWETHDepositTxHash = await etherToken.deposit({
    value: takerAssetAmount,
  });
  console.log({ takerWETHDepositTxHash });

  // Set up the Order and fill it
  const randomExpiration = getRandomFutureDateInSeconds();
  const exchangeAddress = contractWrappers.contractAddresses.exchange;

  // Create the order
  const order: Order = {
    chainId: NETWORK_CONFIGS.chainId,
    exchangeAddress,
    makerAddress: maker.address,
    takerAddress: NULL_ADDRESS,
    senderAddress: NULL_ADDRESS,
    feeRecipientAddress: NULL_ADDRESS,
    expirationTimeSeconds: randomExpiration,
    salt: generatePseudoRandomSalt(),
    makerAssetAmount: new BigNumber(makerAssetAmount.toString()),
    takerAssetAmount: new BigNumber(takerAssetAmount.toString()),
    makerAssetData,
    takerAssetData,
    makerFeeAssetData: NULL_BYTES,
    takerFeeAssetData: NULL_BYTES,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
  };

  // Generate the order hash and sign it
  const signedOrder = await signatureUtils.ecSignOrderAsync(
    providerEngine,
    order,
    maker.address
  );
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

  const [
    { orderStatus, orderHash },
    remainingFillableAmount,
    isValidSignature,
  ] = await contractWrappers.devUtils
    .getOrderRelevantState(signedOrder, signedOrder.signature)
    .callAsync();
  if (
    orderStatus === OrderStatus.Fillable &&
    remainingFillableAmount.isGreaterThan(0) &&
    isValidSignature
  ) {
    // Order is fillable
  }

  const txHash = await exchange.fillOrder(
    {
      ...signedOrder,
      makerAssetAmount: signedOrder.makerAssetAmount.toString(),
      takerAssetAmount: signedOrder.takerAssetAmount.toString(),
      expirationTimeSeconds: signedOrder.expirationTimeSeconds.toString(),
      salt: signedOrder.salt.toString(),
      makerFee: ZERO,
      takerFee: ZERO,
    },
    takerAssetAmount,
    signedOrder.signature,
    {
      // ...TX_DEFAULTS,
      value: BN.from(calculateProtocolFee([signedOrder]).toString()),
    }
  );
  console.log({ txHash });
}

scenarioAsync()
  .then(() => console.log('Done!!!'))
  .catch(console.error);
