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
  "0x8CDaAC0371a443985c6Faf07938dDAa7A5818674";

export const AVO_PROD_DEPOSIT_ADDRESS =
  "0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E";
export const AVO_STAGING_DEPOSIT_ADDRESS =
  "0x853e991d800Dfd6bC1F83AED3310e859482323dc";

export const AVO_PROD_RPC_URL = "https://rpc.avocado.instadapp.io";

export const AVO_STAGING_RPC_URL = "https://rpc.avocado.instad.app";

export default prod ? Avocado : AvocadoDev;

export const avoChainId = prod ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID;
export const avoChainName = prod ? AVO_PROD_CHAIN_NAME : AVO_STAGING_CHAIN_NAME;

export const forwarderProxyAddress = prod
  ? AVO_PROD_FORWARDER_ADDR
  : AVO_STAGING_FORWARDER_ADDR;

export const avoDepositAddress = prod
  ? AVO_PROD_DEPOSIT_ADDRESS
  : AVO_STAGING_DEPOSIT_ADDRESS;
