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
  {
    icon: 'cross',
    title: 'Cross-Chain Send',
    content: 'Send funds directly from chain A to anyone on chain B. No hassles of manually bridging.',
  },
]

function onContinue() {
  welcomeMessageShow.value = true
}

watch(welcomeMessageShow, () => {
  emit('destroy')
})
</script>

<template>
  <div class="flex flex-col gap-[30px] pb-[30px]">
    <div class="flex flex-col gap-[10px] px-[30px] pt-[30px]">
      <p class="text-[26px] font-semibold leading-[30px]">
        Welcome to Avocado
      </p>
      <p class="text-slate-400 leading-[20px] text-[14px]">
        The web3 superwallet
      </p>
    </div>
    <hr class="border-slate-800">
    <div v-for="item of data" :key="item.title" class="flex flex-row gap-[20px] justify-center items-center px-[30px]">
      <div class="bg-[#4CA0541a] rounded-full w-[46px] h-[46px] flex justify-center items-center">
        <SvgoWNetwork v-if="item.icon === 'network'" />
        <SvgoWGasTank v-if="item.icon === 'gastank'" />
        <SvgoWRefresh v-if="item.icon === 'refresh'" />
        <SvgoWCross v-if="item.icon === 'cross'" />
      </div>
      <div class="flex flex-col flex-1 gap-[12px]">
        <p class="text-[18px] font-semibold leading-[20px]">
          {{ item.title }}
        </p>
        <p class="text-slate-400 text-[12px] leading-[20px]">
          {{ item.content }}
        </p>
      </div>
    </div>
    <hr class="border-slate-800">
    <div class="w-full px-[30px] flex flex-col gap-[20px] justify-center items-center">
      <button class="bg-[#4CA054] rounded-full px-[30px] py-[12px] text-[14px] leading-[20px] font-semibold w-full hover:bg-[]" @click="onContinue()">
        Continue
      </button>
      <NuxtLink
        href="https://help.avocado.instadapp.io/en/articles/7038838-a-checklist-to-get-started-with-avocado"
        target="_blank"
        class="inline-flex text-primary text-sm items-center gap-2"
      >
        Learn more about Avocado
        <ExternalLinkSVG class="w-3 h-3" />
      </NuxtLink>
    </div>
  </div>
</template>
