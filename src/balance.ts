import {
    ContractWrappers,
} from '@0x/contract-wrappers';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { providers, Wallet } from 'ethers';

import { MNEMONIC, NETWORK_CONFIGS } from './configs';
import { PrintUtils } from './print_utils';
import { providerEngine } from './provider_engine';

/**
 * In this scenario, the maker creates and signs an order for selling ZRX for WETH.
 * The taker takes this order and fills it via the 0x Exchange contract.
 */
export async function scenarioAsync(): Promise<void> {
    //   await runMigrationsOnceIfRequiredAsync();
    PrintUtils.printScenario('Balance');
    // Initialize the ContractWrappers, this provides helper functions around calling
    // 0x contracts as well as ERC20/ERC721 token contracts on the blockchain
    const contractWrappers = new ContractWrappers(providerEngine, {
        chainId: NETWORK_CONFIGS.chainId,
        contractAddresses: {
            erc20Proxy: '0xc845dfd21558dec2ae4762b90804e50a4ff805be',
            erc721Proxy: '0x9c73e48e8c35d40ee62338aa11245007d7cbda9a',
            erc1155Proxy: '0xf3b09d4ecc39bec6a34689c0b5a3d8fd65de827f',
            zrxToken: '0x5a1830Ebe15f422C1A9dFC04e2C7ad496cecA12a',
            etherToken: '0x8b130ac5ec1545aa2068cc3cf420cc4a00dc6de1',
            exchange: '0x41cbd52a546b5bd3a3bcf0ca72ef3123d3a7c94a',
            assetProxyOwner: '0x0000000000000000000000000000000000000000',
            erc20BridgeProxy: '0xcd97c020c81fbf99818ca68a61c7fa6e453dedba',
            zeroExGovernor: '0x0000000000000000000000000000000000000000',
            forwarder: '0xf81da26fc06151e5e1cd074f899a85c3b0af13ce',
            coordinatorRegistry: '0x9e81f55494b6f784ab1e6cecae932eefbd86ff9b',
            coordinator: '0x2b923459010c011a99e6d63c329dcb21eb26c733',
            multiAssetProxy: '0x07015f16de25dd0a15d3b911bb7abfe66ae355dd',
            staticCallProxy: '0x4f96e1002d708d300fbbfa29c026ebc475c0302d',
            devUtils: '0x91200dba02531d701f2085f109bf405e029fbc5e',
            exchangeV2: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
            zrxVault: '0x1f05dce717977938790ba3fe00704d45dbf43bfc',
            staking: '0xcd407f56e087554a0477360bfe3527a85b05b3bd',
            stakingProxy: '0x32aacd8aa76b460d761a1f456ef9d9ceae243e89',
            erc20BridgeSampler: '0x0000000000000000000000000000000000000000',
            chaiBridge: '0x0000000000000000000000000000000000000000',
            dydxBridge: '0x0000000000000000000000000000000000000000',
            godsUnchainedValidator: '0x0000000000000000000000000000000000000000',
            broker: '0x0000000000000000000000000000000000000000',
            chainlinkStopLimit: '0x0000000000000000000000000000000000000000',
            maximumGasPrice: '0x0000000000000000000000000000000000000000',
            dexForwarderBridge: '0x0000000000000000000000000000000000000000',
            exchangeProxyGovernor: '0x0000000000000000000000000000000000000000',
            exchangeProxy: '0xd534975ef980635e356be02e07a4339ebb2de6c1',
            exchangeProxyTransformerDeployer:
                '0x2D4159A016fD5318da2057a2173d48Dc11af314e',
            exchangeProxyFlashWallet: '0xbe56d54ed0008fb01d4a2ebc9b64664c939753b9',
            exchangeProxyLiquidityProviderSandbox:
                '0x0000000000000000000000000000000000000000',
            transformers: {
                wethTransformer: '0xdd50f341f847a84e853d82408fa61e53ca01da62',
                payTakerTransformer: '0x5fb4163f4b5d38a052dc73e817e52197a5bb9112',
                fillQuoteTransformer: '0x1cc2a117ce05864d1bee9542d657cfcccfda313c',
                affiliateFeeTransformer: '0x4e051c0e1b8db03238866558d89525509806049f',
                positiveSlippageFeeTransformer:
                    '0xf53a9fd7b25328f7c2910983d60f70e2a0af784b',
            },
        },
    });
    const hatAddress = '0x0e4355d3cB1796Bcf695c3172c43a151FBFDE367';
    // Initialize the Web3Wrapper, this provides helper functions around fetching
    // account information, balances, general contract logs
    const web3Wrapper = new Web3Wrapper(providerEngine);
    const provider = new providers.JsonRpcProvider(NETWORK_CONFIGS.rpcUrl);
    const maker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/4").connect(provider);
    const taker = Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/5").connect(
        provider
    );

    const zrxTokenAddress = contractWrappers.contractAddresses.zrxToken;
    const printUtils = new PrintUtils(
        web3Wrapper,
        contractWrappers,
        { maker: maker.address, taker: taker.address },
        { HAT: hatAddress, ZRX: zrxTokenAddress }
    );
    printUtils.printAccounts();


    await printUtils.fetchAndPrintContractAllowancesAsync();
    await printUtils.fetchAndPrintContractBalancesAsync();

    // Stop the Provider Engine
    providerEngine.stop();
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
