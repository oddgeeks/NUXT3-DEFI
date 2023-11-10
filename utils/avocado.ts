import { _getAppConfig } from 'nuxt/app'

const config = _getAppConfig()

const isProd = config.isProd

export const avoChainId = isProd ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID
export const avoChainName = isProd
  ? AVO_PROD_CHAIN_NAME
  : AVO_STAGING_CHAIN_NAME

export const AVO_PROD_MULTISIG_FORWARDER_ADDR = '0x46978CD477A496028A18c02F07ab7F35EDBa5A54'
export const AVO_STAGING_MULTISIG_FORWARDER_ADDR = '0x6f444b80f944FA5Ce3f74cC0e4e1371844B5F91e'

export const stagingGasBalanceManagerAddress = '0x847b123EB1Ed2f51bC8A5ed7D5C9091595793ae7'
export const prodGasBalanceManagerAddress = '0x0bF8d2e143550874ADE7c2eb1e768aa494debB44'

export const stagingInstadappSigner = '0x2D8EE1C03b88b4b72B1c05Dab218EE1982147602'
export const prodInstadappSigner = '0x27A26e2f1CaD33cD0389A85Ab09a6b4f169Bc34f'

export const multisigForwarderProxyAddress = isProd
  ? AVO_PROD_MULTISIG_FORWARDER_ADDR
  : AVO_STAGING_MULTISIG_FORWARDER_ADDR

export const forwarderProxyAddress = isProd
  ? AVO_PROD_FORWARDER_ADDR
  : AVO_STAGING_FORWARDER_ADDR

export const avoDepositAddress = isProd
  ? AVO_PROD_DEPOSIT_ADDRESS
  : AVO_STAGING_DEPOSIT_ADDRESS

export const gasBalanceManagerAddress = isProd ? prodGasBalanceManagerAddress : stagingGasBalanceManagerAddress

export const avoExplorerURL = getNetworkByChainId(avoChainId).explorerUrl

export const avoOnboardURL = isProd
  ? 'https://onboard.avocado.instadapp.io'
  : 'https://onboard.avocado.instad.app'

export const zerionApiURL = 'https://api.zerion.io/v1'

export const incorrectAddress = '0x0000000000000000000000000000000000000000'
export const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const blockQueryURL = 'https://blockquery.instadapp.io'

const swapAggregatorURLProd = 'https://swap-aggregator.instadapp.io'
const swapAggregatorURLStaging = 'https://swap-aggregator.instad.app'

const multisigURLStaging = 'https://multisig.api.avocado.instad.app'
const multisigURLProd = 'https://multisig-api.avocado.instadapp.io'

const swapAggregatorTokenProd = 'hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C'
const swapAggregatorTokenStaging = 'tZIvMelWpiGgfZyDHJLVEygCvXC'

export const walletConnectMetadata = {
  description: 'Instadapp Avocado - Safe',
  url: 'https://avocado.instadapp.io',
  icons: ['https://walletconnect.org/walletconnect-logo.png'],
  name: 'Instadapp Avocado',
}

export const swapAggregatorURL = isProd
  ? swapAggregatorURLProd
  : swapAggregatorURLStaging

export const swapAggregatorAccessToken = isProd
  ? swapAggregatorTokenProd
  : swapAggregatorTokenStaging

export const ABIfetcherSupportedNetworks = ['polygon', 'mainnet', 'fantom', 'arbitrum', 'avalanche', 'optimism', 'bsc', 'gnosis']
export const warnedDapps = ['https://app.safe.global', 'https://mint.fun', 'https://app.velodrome.finance', 'https://app.frax.finance', 'https://docs.frax.finance']
export const bannedDapps = ['https://www.orbiter.finance', 'https://mirror.xyz', 'https://blog.summer.fi', 'https://summer.fi', 'https://opensea.io']

export const bridgeDisabledChains = [250, 122]
export const swapDisabledChains = [122]
export const multisigURL = isProd ? multisigURLProd : multisigURLStaging
export const instadappSigner = isProd ? prodInstadappSigner : stagingInstadappSigner

export const observableAccount = '0xcf877a28c4f86b0d3fb7e5a52156f094140ba742'
