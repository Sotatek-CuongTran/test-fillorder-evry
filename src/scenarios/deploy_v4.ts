import { runMigrationsAsync, runMigrationsOnceAsync } from '@0x/migrations';
import { devConstants, web3Factory } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Web3ProviderEngine } from '@0x/subproviders';
import { providerEngine } from '../provider_engine';

/**
 * In this scenario, the maker creates and signs an order for selling ZRX for WETH.
 * The taker takes this order and fills it via the 0x Exchange contract.
 */
export async function scenarioAsync(): Promise<void> {
  const provider: Web3ProviderEngine = web3Factory.getRpcProvider({
    shouldUseInProcessGanache: true,
  });
  const web3Wrapper = new Web3Wrapper(provider);
  const txDefaults = {
    gas: devConstants.GAS_LIMIT,
    from: devConstants.TESTRPC_FIRST_ADDRESS,
  };

  const contractAddresses = await runMigrationsAsync(provider, txDefaults);
  console.log({ contractAddresses });
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
