import * as Avocado from "@instadapp/avocado";
import * as AvocadoDev from "@instadapp/avocado-dev";
import config from "#build/app.config.mjs";

const prod = config.buildInfo.env === "release";

console.log({
  prod,
});

export default prod ? Avocado : AvocadoDev;

export const avoChainId = prod ? 634 : 63400;
export const avoChainName = prod ? "Avocado" : "Avocado Testnet";
export const forwarderProxyAddress = prod
  ? "0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5"
  : "0x3760C57787f5d5A8904a6D1818a7d1cA86fAf40D";
