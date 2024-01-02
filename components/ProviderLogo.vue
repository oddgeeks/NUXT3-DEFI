<script setup lang="ts">
import SVGMetamask from '~/assets/images/wallet/metamask.svg?inline'
import SVGTrustWallet from '~/assets/images/wallet/trust-wallet.svg?inline'
import SVGSafePal from '~/assets/images/wallet/safepal.svg?inline'
import SVGRabby from '~/assets/images/wallet/rabby.svg?inline'
import SVGLedger from '~/assets/images/wallet/ledger.svg?inline'
import SVGBrave from '~/assets/images/wallet/brave.svg?inline'
import SVGCoinbase from '~/assets/images/wallet/coinbase.svg?inline'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect.svg?inline'
import Generic from '~/assets/images/wallet/generic.png'

const props = defineProps<{
  providerName: string
}>()

const logoMapping: Record<string, string> = {
  'MetaMask': SVGMetamask,
  'Trust Wallet': SVGTrustWallet,
  'SafePal Wallet': SVGSafePal,
  'Rabby Wallet': SVGRabby,
  'LedgerConnect': SVGLedger,
  'Brave Wallet': SVGBrave,
  'Coinbase Wallet': SVGCoinbase,
  'WalletConnect': SVGWalletConnect,
}

const logo = logoMapping[props.providerName] || Generic
</script>

<template>
  <img :src="logo" class="h-7.5 w-7.5">
</template>
