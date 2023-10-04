<script setup lang="ts">
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'

const emit = defineEmits(['destroy'])
const welcomeMessageShow = useLocalStorage<Boolean>('welcome_message_check', false)
const data = [
  {
    icon: 'network',
    title: 'Control Using Your EOA',
    content: 'Your Avocado Smart Wallet will be controlled by your Browser wallet that supports EVM Networks.',
  },
  {
    icon: 'gastank',
    title: 'Unified USDC Gas Tank',
    content: 'Top up your gas tank once & use that to cover gas fees on any supported chain. No need to manage native tokens.',
  },
  {
    icon: 'refresh',
    title: 'Auto Switch',
    content: 'Connect any dapp to Avocado using WalletConnect and Avocado automatically switches network for you when required.',
  },
]

welcomeMessageShow.value = true

function onContinue() {
  emit('destroy')
}
</script>

<template>
  <div class="flex flex-col gap-7.5 pb-7.5">
    <div class="flex flex-col gap-2.5 px-7.5 pt-7.5">
      <p class="text-[26px] font-semibold leading-[30px]">
        Welcome to Avocado
      </p>
      <p class="text-sm font-medium leading-5 text-slate-400">
        The web3 superwallet
      </p>
    </div>
    <hr class="border-slate-800">
    <div v-for="item of data" :key="item.title" class="flex flex-row items-center justify-center gap-5 px-7.5">
      <div class="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#4CA0541a]">
        <SvgoWNetwork v-if="item.icon === 'network'" />
        <SvgoWGasTank v-if="item.icon === 'gastank'" />
        <SvgoWRefresh v-if="item.icon === 'refresh'" />
        <SvgoWCross v-if="item.icon === 'cross'" />
      </div>
      <div class="flex flex-1 flex-col gap-3">
        <p class="text-lg font-semibold leading-5">
          {{ item.title }}
        </p>
        <p class="text-xs font-medium leading-5 text-slate-400">
          {{ item.content }}
        </p>
      </div>
    </div>
    <hr class="border-slate-800">
    <div class="flex w-full flex-col items-center justify-center gap-5 px-7.5">
      <button class="w-full rounded-full bg-[#4CA054] px-7.5 py-3 text-sm font-semibold leading-5" @click="onContinue()">
        Continue
      </button>
      <NuxtLink
        href="https://help.avocado.instadapp.io/en/articles/7038838-a-checklist-to-get-started-with-avocado"
        target="_blank"
        class="inline-flex items-center gap-2 text-xs text-primary"
      >
        Learn more about Avocado
        <ExternalLinkSVG class="h-3 w-3" />
      </NuxtLink>
    </div>
  </div>
</template>
