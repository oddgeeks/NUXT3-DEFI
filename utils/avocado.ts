export const AVO_PROD_MULTISIG_FORWARDER_ADDR = '0x46978CD477A496028A18c02F07ab7F35EDBa5A54'
export const AVO_STAGING_MULTISIG_FORWARDER_ADDR = '0x6f444b80f944FA5Ce3f74cC0e4e1371844B5F91e'

export const AVO_PROD_FORWARDER_ADDR
  = '0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5'
export const AVO_STAGING_FORWARDER_ADDR
  = '0x8CDaAC0371a443985c6Faf07938dDAa7A5818674'

export const stagingGasBalanceManagerAddress = '0x847b123EB1Ed2f51bC8A5ed7D5C9091595793ae7'
export const prodGasBalanceManagerAddress = '0x0bF8d2e143550874ADE7c2eb1e768aa494debB44'

export const stagingInstadappSigner = '0x2D8EE1C03b88b4b72B1c05Dab218EE1982147602'
export const prodInstadappSigner = '0x27A26e2f1CaD33cD0389A85Ab09a6b4f169Bc34f'

export const avoOnboardURLProd = 'https://onboard.avocado.instadapp.io'
export const avoOnboardURLStaging = 'https://onboard.avocado.instad.app'

export const zerionApiURL = 'https://api.zerion.io/v1'

export const incorrectAddress = '0x0000000000000000000000000000000000000000'
export const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const blockQueryURL = 'https://blockquery.instadapp.io'

export const swapAggregatorURLProd = 'https://swap-aggregator.instadapp.io'
export const swapAggregatorURLStaging = 'https://swap-aggregator.instad.app'

export const firebaseURL = 'https://avocado-a7489-default-rtdb.firebaseio.com'

export const multisigURLStaging = 'https://multisig.api.avocado.instad.app'
export const multisigURLProd = 'https://multisig-api.avocado.instadapp.io'

export const swapAggregatorTokenProd = 'hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C'
export const swapAggregatorTokenStaging = 'tZIvMelWpiGgfZyDHJLVEygCvXC'

export const walletConnectMetadata = {
  description: 'Instadapp Avocado - Safe',
  url: 'https://avocado.instadapp.io',
  icons: ['https://walletconnect.org/walletconnect-logo.png'],
  name: 'Instadapp Avocado',
}

export const ABIfetcherSupportedNetworks = ['polygon', 'mainnet', 'fantom', 'arbitrum', 'avalanche', 'optimism', 'bsc', 'gnosis', 'fuse']

export const bridgeDisabledChains = [250, 122, 204, 534352]
export const swapDisabledChains = [122, 204, 534352]
export const legacyNotSupportedChains = [122, 204, 534352]
export const networksSimulationNotSupported = [1313161554, 1101, 122, 204, 534352]

export const observableAccount = '0xcf877a28c4f86b0d3fb7e5a52156f094140ba742'

export function getMultisigForwarderProxyAddress(isProd: boolean) {
  return isProd ? AVO_PROD_MULTISIG_FORWARDER_ADDR : AVO_STAGING_MULTISIG_FORWARDER_ADDR
}

export function getForwarderProxyAddress(isProd: boolean) {
  return isProd ? AVO_PROD_FORWARDER_ADDR : AVO_STAGING_FORWARDER_ADDR
}
