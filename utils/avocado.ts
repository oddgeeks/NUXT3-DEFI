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

export const blockQueryURL = 'https://blockquery.instadapp.io'
