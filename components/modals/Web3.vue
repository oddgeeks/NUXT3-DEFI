<script setup lang="ts">
defineProps<{
  buttonClass?: string
}>()
const emit = defineEmits(['destroy'])
const { activate } = useWeb3()

const { providers } = useNetworks()
const { setConnectorName } = useConnectors()

const loading = ref<Record<string, boolean>>({})

async function connect(provider: any) {
  try {
    loading.value[provider.name] = true
    await activate(await provider.connect(), undefined, true)

    const { success } = await openRequestTermsSignature()

    if (success) {
      setConnectorName(provider.id)
      emit('destroy')
    }
  }
  catch (e) {
    console.log(e)
  }
  finally {
    loading.value[provider.name] = false
  }
}

function isProviderVisible(provider: Provider) {
  if (process.client) {
    if (provider.name === 'Metamask' && !window.ethereum)
      return false
    return true
  }
}
</script>

<template>
  <div class="relative">
    <slot name="title">
      <div class="mb-7 flex flex-col items-center justify-center gap-4">
        <span class="text-lg">Connect wallet</span>
      </div>
    </slot>

    <ul class="grid gap-[15px] px-2 pb-2">
      <li v-for="provider in providers" :key="provider.name">
        <button
          v-if="isProviderVisible(provider)"
          class="group flex w-full items-center gap-4 rounded-[40px] bg-slate-100 px-5 py-[15px] transition-colors dark:bg-gray-850"
          :class="
            [
              provider.name === 'Metamask'
                ? 'hover:bg-[#FEF1E8] dark:hover:bg-[#282125]'
                : 'hover:bg-[#EBF2FE] dark:hover:bg-[#15233C]',
              buttonClass,
            ]
          "
          @click="connect(provider)"
        >
          <div class="flex flex-1 items-center gap-[15px]">
            <component :is="provider.logo" class="h-7.5 w-7.5" />

            <span class="text-[16px]">{{ provider.name }}</span>
          </div>

          <svg
            v-if="loading[provider.name]" :class="
              provider.name === 'Metamask'
                ? 'text-orange-500'
                : 'text-primary'
            " class="-ml-1 mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          <svg
            v-else class="text-slate-500 transition-all" :class="
              provider.name === 'Metamask'
                ? 'group-hover:text-orange-500'
                : 'group-hover:text-primary'
            " width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.75 9H14.25" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 3.75L14.25 9L9 14.25" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>
