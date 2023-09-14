import * as Avocado from '@instadapp/avocado'
import * as AvocadoDev from '@instadapp/avocado-dev'
import { _getAppConfig } from 'nuxt/app'

const config = _getAppConfig()

const isProd = config.isProd

export default isProd ? Avocado : AvocadoDev

export const avoChainId = isProd ? AVO_PROD_CHAIN_ID : AVO_STAGING_CHAIN_ID
export const avoChainName = isProd
  ? AVO_PROD_CHAIN_NAME
  : AVO_STAGING_CHAIN_NAME

export const multisigForwarderProxyAddress = isProd
  ? '0x46978CD477A496028A18c02F07ab7F35EDBa5A54'
  : '0x6f444b80f944FA5Ce3f74cC0e4e1371844B5F91e'

export const forwarderProxyAddress = isProd
  ? AVO_PROD_FORWARDER_ADDR
  : AVO_STAGING_FORWARDER_ADDR

export const avoDepositAddress = isProd
  ? AVO_PROD_DEPOSIT_ADDRESS
  : AVO_STAGING_DEPOSIT_ADDRESS

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

export const warnedDapps = ['https://app.safe.global', 'https://mint.fun', 'https://app.velodrome.finance', 'https://app.frax.finance', 'https://docs.frax.finance']
export const bannedDapps = ['https://www.orbiter.finance', 'https://mirror.xyz', 'https://blog.summer.fi', 'https://summer.fi', 'https://opensea.io']

export const bridgeDisabledChains = [250, 122]
export const swapDisabledChains = [122]
export const multisigURL = isProd ? multisigURLProd : multisigURLStaging
