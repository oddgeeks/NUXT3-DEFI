<script lang="ts" setup>
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'

const { account } = useWeb3()
const { avoExplorerURL } = storeToRefs(useEnvironmentState())
</script>

<template>
  <div class="mb-5 flex flex-col gap-5 md:hidden">
    <div class="flex">
      <NuxtLink class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" to="/" active-class="!text-primary bg-[#4CA0541A]">
        <SvgoHome />
      </NuxtLink>

      <NuxtLink class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" to="/contacts" active-class="!text-primary bg-[#4CA0541A]">
        <SvgoContact class="h-[15px]" />
      </NuxtLink>

      <NuxtLink class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" to="/nft" active-class="!text-primary bg-[#4CA0541A]">
        <SvgoFire />
      </NuxtLink>

      <NuxtLink target="_blank" external class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" :to="`${avoExplorerURL}/address/${account}`">
        <SvgoCalendar class="h-[18px]" />
      </NuxtLink>

      <NuxtLink class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" to="/defi" active-class="!text-primary bg-[#4CA0541A]">
        <SvgoDefi class="h-[18px]" />
      </NuxtLink>

      <button class="flex h-10 flex-1 items-center justify-center rounded-xl text-gray-400" @click="openWalletConnectModal()">
        <SVGWalletConnect />
      </button>
    </div>
    <hr class="mobile-navigation-bottom-line border-gray-800">
  </div>
</template>

<style scoped>
.mobile-navigation-bottom-line {
  transform: translateX(-16px);
  width: calc(100% + 32px);
}
</style>
