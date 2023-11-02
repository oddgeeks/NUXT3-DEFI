import { acceptHMRUpdate, defineStore } from 'pinia'

import {
  AVO_PROD_FORWARDER_ADDR,
  AVO_PROD_MULTISIG_FORWARDER_ADDR,
  AVO_STAGING_FORWARDER_ADDR,
  AVO_STAGING_MULTISIG_FORWARDER_ADDR,
  avoOnboardURLProd,
  avoOnboardURLStaging,
  multisigURLProd,
  multisigURLStaging,
  prodInstadappSigner,
  stagingInstadappSigner,
  swapAggregatorTokenProd,
  swapAggregatorTokenStaging,
  swapAggregatorURLProd,
  swapAggregatorURLStaging,
} from '../utils/avocado'

export const useEnvironmentState = defineStore('environment-state', () => {
  const { isProd } = storeToRefs(useShared())

  const avoChainId = computed(() => isProd.value ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID)
  const avoChainName = computed(() => isProd.value
    ? AVO_PROD_CHAIN_NAME
    : AVO_STAGING_CHAIN_NAME)

  const multisigForwarderProxyAddress = computed(() => isProd.value
    ? AVO_PROD_MULTISIG_FORWARDER_ADDR
    : AVO_STAGING_MULTISIG_FORWARDER_ADDR)

  const forwarderProxyAddress = computed(() => isProd.value
    ? AVO_PROD_FORWARDER_ADDR
    : AVO_STAGING_FORWARDER_ADDR)

  const avoDepositAddress = computed(() => isProd.value
    ? AVO_PROD_DEPOSIT_ADDRESS
    : AVO_STAGING_DEPOSIT_ADDRESS)

  const avoExplorerURL = computed(() => getNetworkByChainId(avoChainId.value).explorerUrl)

  const avoOnboardURL = computed(() => isProd.value
    ? avoOnboardURLProd
    : avoOnboardURLStaging)

  const instadappSigner = computed(() => isProd.value ? prodInstadappSigner : stagingInstadappSigner)

  const multisigURL = computed(() => isProd.value ? multisigURLProd : multisigURLStaging)

  const swapAggregatorAccessToken = computed(() => isProd.value
    ? swapAggregatorTokenProd
    : swapAggregatorTokenStaging)

  const swapAggregatorURL = computed(() => isProd.value
    ? swapAggregatorURLProd
    : swapAggregatorURLStaging)

  return {
    isProd,
    avoChainId,
    avoChainName,
    multisigForwarderProxyAddress,
    forwarderProxyAddress,
    avoDepositAddress,
    avoExplorerURL,
    avoOnboardURL,
    instadappSigner,
    multisigURL,
    swapAggregatorAccessToken,
    swapAggregatorURL,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useEnvironmentState, import.meta.hot))
