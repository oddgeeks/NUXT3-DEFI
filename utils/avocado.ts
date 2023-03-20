import * as Avocado from "@instadapp/avocado";
import * as AvocadoDev from "@instadapp/avocado-dev";

const isProd = globalThis?.__NUXT__?.config?.public?.env === "release";

export default isProd ? Avocado : AvocadoDev;

export const avoChainId = isProd ? 634 : 63400;
export const avoChainName = isProd ? "Avocado" : "Avocado Testnet";
export const forwarderProxyAddress = isProd
  ? "0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5"
  : "0x3760C57787f5d5A8904a6D1818a7d1cA86fAf40D";
