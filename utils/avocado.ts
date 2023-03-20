import * as Avocado from "@instadapp/avocado";
import * as AvocadoDev from "@instadapp/avocado-dev";
import config from "#build/app.config.mjs";

const prod = config.buildInfo.env === "release";

console.log({
  prod,
});

export const AVO_PROD_CHAIN_ID = 634;
export const AVO_PROD_CHAIN_NAME = "Avocado";

export const AVO_STAGING_CHAIN_ID = 63400;
export const AVO_STAGING_CHAIN_NAME = "Avocado Testnet";

export const AVO_PROD_FORWARDER_ADDR =
  "0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5";
export const AVO_STAGING_FORWARDER_ADDR =
  "0x3760C57787f5d5A8904a6D1818a7d1cA86fAf40D";

export default prod ? Avocado : AvocadoDev;

export const avoChainId = prod ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID;
export const avoChainName = prod ? AVO_PROD_CHAIN_NAME : AVO_STAGING_CHAIN_NAME;

export const forwarderProxyAddress = prod
  ? AVO_PROD_FORWARDER_ADDR
  : AVO_STAGING_FORWARDER_ADDR;
