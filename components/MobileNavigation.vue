<script lang="ts" setup>
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'

const { account } = useWeb3()
</script>

<template>
  <div class="flex ">
    <NuxtLink class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" to="/" active-class="!text-primary bg-[#4CA0541A]">
      <SvgoHome />
    </NuxtLink>

    <NuxtLink class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" to="/contacts" active-class="!text-primary bg-[#4CA0541A]">
      <SvgoContact class="h-[15px]" />
    </NuxtLink>

    <NuxtLink class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" to="/nft" active-class="!text-primary bg-[#4CA0541A]">
      <SvgoFire />
    </NuxtLink>

    <NuxtLink target="_blank" external class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" :to="`${avoExplorerURL}/address/${account}`">
      <SvgoCalendar class="h-[18px]" />
    </NuxtLink>

    <NuxtLink class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" to="/defi" active-class="!text-primary bg-[#4CA0541A]">
      <SvgoDefi class="h-[18px]" />
    </NuxtLink>

    <button class="flex-1 flex justify-center items-center user-nav-icon h-10 rounded-xl">
      <SvgoUser />
    </button>

    <button class="flex-1 flex justify-center items-center text-slate-400 h-10 rounded-xl" @click="openWalletConnectModal()">
      <SVGWalletConnect />
    </button>
  </div>
</template>
