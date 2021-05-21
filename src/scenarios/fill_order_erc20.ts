import { ContractWrappers, OrderStatus } from '@0x/contract-wrappers';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';

import {
  generatePseudoRandomSalt,
  Order,
  signatureUtils,
} from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { MNEMONIC, NETWORK_CONFIGS, TX_DEFAULTS } from '../configs';
import {
  DECIMALS,
  NULL_ADDRESS,
  NULL_BYTES,
  UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
  ZERO,
} from '../constants';
import { PrintUtils } from '../print_utils';
import { providerEngine } from '../provider_engine';
import {
  calculateProtocolFee,
  getEmptyLimitOrder,
  getRandomFutureDateInSeconds,
} from '../utils';
import * as wethABI from '../abis/weth.json';
import { Contract, providers, Wallet } from 'ethers';

/**
 * In this scenario, the maker creates and signs an order for selling ZRX for WETH.
 * The taker takes this order and fills it via the 0x Exchange contract.
 */
export async function scenarioAsync(): Promise<void> {
  //   await runMigrationsOnceIfRequiredAsync();
  PrintUtils.printScenario('Fill Order');
  // Initialize the ContractWrappers, this provides helper functions around calling
  // 0x contracts as well as ERC20/ERC721 token contracts on the blockchain
  const contractWrappers = new ContractWrappers(providerEngine, {
    chainId: NETWORK_CONFIGS.chainId,
  });
  // Initialize the Web3Wrapper, this provides helper functions around fetching
  // account information, balances, general contract logs
  const web3Wrapper = new Web3Wrapper(providerEngine);
  const provider = new providers.JsonRpcProvider(NETWORK_CONFIGS.rpcUrl);
  const maker = Wallet.fromMnemonic(MNEMONIC).connect(provider);
  const taker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/1").connect(
    provider
  );

  const zrxTokenAddress = contractWrappers.contractAddresses.zrxToken;
  const etherTokenAddress = contractWrappers.contractAddresses.etherToken;
  const printUtils = new PrintUtils(
    web3Wrapper,
    contractWrappers,
    { maker: maker.address, taker: taker.address },
    { WETH: etherTokenAddress, ZRX: zrxTokenAddress }
  );
  printUtils.printAccounts();

  // the amount the maker is selling of maker asset
  const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(0.1),
    DECIMALS
  );
  // the amount the maker wants of taker asset
  const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(0.1),
    DECIMALS
  );

  // Allow the 0x ERC20 Proxy to move ZRX on behalf of makerAccount
  const erc20Token = new Contract(zrxTokenAddress, wethABI, provider);
  const makerZRXApprovalTxHash = await erc20Token
    .connect(maker)
    .approve(
      contractWrappers.contractAddresses.exchangeProxy,
      UNLIMITED_ALLOWANCE_IN_BASE_UNITS.toString()
    );
  await printUtils.awaitTransactionMinedSpinnerAsync(
    'Maker ZRX Approval',
    makerZRXApprovalTxHash.hash
  );

  // Allow the 0x ERC20 Proxy to move WETH on behalf of takerAccount
  const etherToken = new Contract(etherTokenAddress, wethABI, provider);
  const takerWETHApprovalTxHash = await etherToken
    .connect(taker)
    .approve(
      contractWrappers.contractAddresses.exchangeProxy,
      UNLIMITED_ALLOWANCE_IN_BASE_UNITS.toString()
    );
  await printUtils.awaitTransactionMinedSpinnerAsync(
    'Taker WETH Approval',
    takerWETHApprovalTxHash.hash
  );

  // Convert ETH into WETH for taker by depositing ETH into the WETH contract
  const takerWETHDepositTxHash = await etherToken.connect(taker).deposit({
    value: takerAssetAmount.toString(),
  });
  await printUtils.awaitTransactionMinedSpinnerAsync(
    'Taker WETH Deposit',
    takerWETHDepositTxHash.hash
  );

  PrintUtils.printData('Setup', [
    ['Maker ZRX Approval', makerZRXApprovalTxHash.hash],
    ['Taker WETH Approval', takerWETHApprovalTxHash.hash],
    ['Taker WETH Deposit', takerWETHDepositTxHash.hash],
  ]);

  const order = getEmptyLimitOrder({
    chainId: NETWORK_CONFIGS.chainId,
    verifyingContract: contractWrappers.contractAddresses.exchangeProxy,
    makerToken: zrxTokenAddress,
    takerToken: etherTokenAddress,
    makerAmount: makerAssetAmount,
    takerAmount: takerAssetAmount,
    maker: maker.address,
  });
  console.log(order);

  // Print out the Balances and Allowances
  await printUtils.fetchAndPrintContractAllowancesAsync();
  await printUtils.fetchAndPrintContractBalancesAsync();

  //   // Generate the order hash and sign it
  //   const signedOrder = await signatureUtils.ecSignOrderAsync(
  //     providerEngine,
  //     order,
  //     maker
  //   );

  //   const [
  //     { orderStatus, orderHash },
  //     remainingFillableAmount,
  //     isValidSignature,
  //   ] = await contractWrappers.devUtils
  //     .getOrderRelevantState(signedOrder, signedOrder.signature)
  //     .callAsync();
  //   if (
  //     orderStatus === OrderStatus.Fillable &&
  //     remainingFillableAmount.isGreaterThan(0) &&
  //     isValidSignature
  //   ) {
  //     // Order is fillable
  //   }

  //   // Fill the Order via 0x Exchange contract
  //   txHash = await contractWrappers.exchange
  //     .fillOrder(signedOrder, takerAssetAmount, signedOrder.signature)
  //     .sendTransactionAsync({
  //       from: taker,
  //       ...TX_DEFAULTS,
  //       value: calculateProtocolFee([signedOrder]),
  //     });
  //   txReceipt = await printUtils.awaitTransactionMinedSpinnerAsync(
  //     'fillOrder',
  //     txHash
  //   );
  //   printUtils.printTransaction('fillOrder', txReceipt, [
  //     ['orderHash', orderHash],
  //   ]);

  //   // Print the Balances
  //   await printUtils.fetchAndPrintContractBalancesAsync();

  //   // Stop the Provider Engine
  //   providerEngine.stop();
}

void (async () => {
  try {
    if (!module.parent) {
      await scenarioAsync();
    }
  } catch (e) {
    console.log(e);
    providerEngine.stop();
    process.exit(1);
  }
})();
