import {
  GANACHE_NETWORK_ID,
  KOVAN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
} from './constants';
import { NetworkSpecificConfigs } from './types';

export const TX_DEFAULTS = { gas: 800000, gasPrice: 1000000000 };
export const MNEMONIC = 'december carpet ranch page like milk monster correct source ten human indicate';
// export const MNEMONIC =
  // 'stay wasp brass kitchen top easy body unknown destroy grape scatter wasp';
export const BASE_DERIVATION_PATH = `44'/60'/0'/0`;
export const GANACHE_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'http://127.0.0.1:8545',
  networkId: GANACHE_NETWORK_ID,
  chainId: 1337,
};
export const KOVAN_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://kovan.infura.io/',
  networkId: KOVAN_NETWORK_ID,
  chainId: KOVAN_NETWORK_ID,
};
export const ROPSTEN_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://ropsten.infura.io/v3/862ef040239b491fbe5d2c9efd414d98',
  networkId: ROPSTEN_NETWORK_ID,
  chainId: ROPSTEN_NETWORK_ID,
};
export const RINKEBY_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://rinkeby.infura.io/v3/862ef040239b491fbe5d2c9efd414d98',
  networkId: RINKEBY_NETWORK_ID,
  chainId: RINKEBY_NETWORK_ID,
};
export const EVRYNET_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'http://192.168.1.208:22002',
  networkId: 15,
  chainId: 15,
};

export const NETWORK_CONFIGS = EVRYNET_CONFIGS; // or KOVAN_CONFIGS or ROPSTEN_CONFIGS or RINKEBY_CONFIGS
// export const NETWORK_CONFIGS = ROPSTEN_CONFIGS; // or KOVAN_CONFIGS or ROPSTEN_CONFIGS or RINKEBY_CONFIGS
