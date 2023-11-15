<script setup lang="ts">
import Fuse from 'fuse.js'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'

const { networkPreference } = storeToRefs(useSafe())
const { isHideZeroBalances, listType } = useAccountState()

const search = ref('')

const filteredNetworks = computed(() => {
  if (!search.value)
    return availableNetworks

  const fuse = new Fuse(availableNetworks || [], {
    keys: ['name', 'chainId'],
    threshold: 0.5,
  })

  const result = fuse.search(search.value)

  return result.map(i => i.item)
})

function toggleNetwork(network: any) {
  if (networkPreference.value.includes(network))
    networkPreference.value = networkPreference.value.filter(n => n !== network)
  else
    networkPreference.value = [...networkPreference.value, network]
}

function toggleAllNetworks() {
  if (networkPreference.value.length === availableNetworks.length)
    networkPreference.value = []
  else
    networkPreference.value = availableNetworks.map(n => n.chainId)
}

function selectType(type: string) {
  listType.value = type
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col gap-2.5 border-b border-gray-875 p-5">
      <ModalTitle class="mb-2.5 items-center">
        <template #icon>
          <SvgoFilter />
        </template>
        <template #title>
          Filter
        </template>
      </ModalTitle>
      <ClientOnly>
        <button
          :class="{
            'text-white': isHideZeroBalances,
          }"
          class="inline-flex w-full items-center justify-center gap-2.5 rounded-7.5 border border-gray-800 px-[14px] py-2.5 text-xs text-gray-400"
          @click="isHideZeroBalances = !isHideZeroBalances"
        >
          <SvgoCheckCircle
            :class="[
              { 'success-circle text-white': isHideZeroBalances },
              { 'svg-circle darker': !isHideZeroBalances },
            ]"
            class="h-4.5 w-4.5"
          />
          Hide 0 balances
        </button>
      </ClientOnly>
      <div class="flex justify-center rounded-7.5 bg-gray-900">
        <button :class="listType === 'individual' ? 'bg-primary' : ''" class="flex flex-1 items-center  justify-center gap-2.5 rounded-l-[inherit] px-[14px] py-2.5 text-xs" @click="selectType('individual')">
          <SvgoRegularView />
          Regular list
        </button>
        <button :class="listType === 'group' ? 'bg-primary' : ''" class="flex flex-1 items-center justify-center gap-2.5 rounded-r-[inherit] px-[14px]  py-2.5 text-xs" @click="selectType('group')">
          <SvgoGroupingView />
          Grouping Chain
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 p-5">
      <div
        class="flex items-center justify-between gap-2.5 text-xs"
      >
        <span class="text-gray-400">All Networks</span>
        <div
          class="cursor-pointer text-green-600"
          @click="toggleAllNetworks"
        >
          {{
            networkPreference.length === availableNetworks.length ? "Deselect All" : "Select All"
          }}
        </div>
      </div>
      <CommonInput v-model="search" autofocus placeholder="Search" name="search-input" input-classes="!py-1.5" type="search">
        <template #prefix>
          <SvgoSearch class="mr-2 text-gray-400" />
        </template>
      </CommonInput>

      <ul class="min-h-[500px]">
        <li
          v-for="network in filteredNetworks"
          :key="network.chainId"
          class="flex cursor-pointer items-center gap-2.5 py-2.5"
          :class="{
            'text-gray-500': !networkPreference.includes(network.chainId),
          }"
          @click="toggleNetwork(network.chainId)"
        >
          <ChainLogo style="width: 26px; height: 26px" :chain="network.chainId" />
          {{ network.name }}
          <CheckCircle
            v-if="networkPreference.includes(network.chainId)"
            class="success-circle ml-auto w-7 cursor-pointer"
          />
          <CheckCircle
            v-else
            class="svg-circle darker ml-auto w-7 cursor-pointer"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
