import { runMigrationsOnceAsync } from '@0x/migrations';
import { SignedOrder } from '@0x/order-utils';
import { LimitOrder, LimitOrderFields } from '@0x/protocol-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
// tslint:disable-next-line:no-implicit-dependencies
// import * as ethers from 'ethers';

import { GANACHE_CONFIGS, NETWORK_CONFIGS, TX_DEFAULTS } from './configs';
import { NULL_ADDRESS, ONE_SECOND_MS, TEN_MINUTES_MS, ZERO } from './constants';
import { providerEngine } from './provider_engine';

// HACK prevent ethers from printing 'Multiple definitions for'
// ethers.errors.setLogLevel('error');

/**
 * Returns an amount of seconds that is greater than the amount of seconds since epoch.
 */
export const getRandomFutureDateInSeconds = (): BigNumber => {
  return new BigNumber(Date.now() + TEN_MINUTES_MS)
    .div(ONE_SECOND_MS)
    .integerValue(BigNumber.ROUND_CEIL);
};

export const runMigrationsOnceIfRequiredAsync = async (): Promise<void> => {
  if (NETWORK_CONFIGS === GANACHE_CONFIGS) {
    const web3Wrapper = new Web3Wrapper(providerEngine);
    const [owner] = await web3Wrapper.getAvailableAddressesAsync();
    await runMigrationsOnceAsync(providerEngine, { from: owner });
  }
};

export const calculateProtocolFee = (
  orders: LimitOrder[],
  gasPrice: BigNumber | number = TX_DEFAULTS.gasPrice
): BigNumber => {
  return new BigNumber(150000).times(gasPrice).times(orders.length);
};

export function getEmptyLimitOrder(
  fields: Partial<LimitOrderFields> = {}
): LimitOrder {
  return new LimitOrder({
    makerToken: NULL_ADDRESS,
    takerToken: NULL_ADDRESS,
    makerAmount: ZERO,
    takerAmount: ZERO,
    takerTokenFeeAmount: ZERO,
    maker: NULL_ADDRESS,
    taker: NULL_ADDRESS,
    sender: NULL_ADDRESS,
    feeRecipient: NULL_ADDRESS,
    pool: hexUtils.random(),
    expiry: new BigNumber(Math.floor(Date.now() / 1000 + 3600)),
    salt: new BigNumber(hexUtils.random()),
    ...fields,
  });
}
