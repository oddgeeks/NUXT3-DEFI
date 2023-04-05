import * as Avocado from "@instadapp/avocado";
import * as AvocadoDev from "@instadapp/avocado-dev";
import { _getAppConfig } from "nuxt/app";

const config = _getAppConfig();

const prod = config.buildInfo.env === "release";

export default prod ? Avocado : AvocadoDev;

export const avoChainId = prod ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID;
export const avoChainName = prod ? AVO_PROD_CHAIN_NAME : AVO_STAGING_CHAIN_NAME;

export const forwarderProxyAddress = prod
  ? AVO_PROD_FORWARDER_ADDR
  : AVO_STAGING_FORWARDER_ADDR;

export const avoDepositAddress = prod
  ? AVO_PROD_DEPOSIT_ADDRESS
  : AVO_STAGING_DEPOSIT_ADDRESS;

export const avoExplorerURL =
  getNetworkByChainId(avoChainId).params.explorerUrl;
