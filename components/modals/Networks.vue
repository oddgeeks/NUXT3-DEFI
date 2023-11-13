<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'

const { networkPreference } = storeToRefs(useSafe())
const isHideZeroBalances = useLocalStorage('hide-zero-balances', false)
const listType = useLocalStorage('listType', 'individual')

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
  <div class="flex flex-col items-center space-y-4">
    <span>Filters</span>
    <ClientOnly>
      <button
        :class="{
          'text-white': isHideZeroBalances,
        }"
        class="inline-flex w-full items-center justify-center gap-2.5 text-sm text-gray-400"
        @click="isHideZeroBalances = !isHideZeroBalances"
      >
        Hide 0 Balances

        <CheckCircle
          :class="[
            { 'success-circle text-white': isHideZeroBalances },
            { 'svg-circle darker': !isHideZeroBalances },
          ]"
          class="h-4 w-4"
        />
      </button>
    </ClientOnly>
    <ul class="w-full rounded-5 bg-gray-850 p-[6px]">
      <li
        class="flex items-center justify-between gap-2.5 rounded-[14px] px-3 pb-3.5 pt-1"
      >
        <span class="text-gray-400">Views</span>
      </li>

      <li
        class="flex cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-2.5  hover:bg-gray-900"
        :class="{
          'text-gray-500': listType !== 'group',
        }"
        @click="() => selectType('group')"
      >
        <SvgoGroup :class="`${listType === 'group' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[22px] h-[22px]`" />
        Group view
        <CheckCircle
          v-if="listType === 'group'"
          class="success-circle ml-auto w-7 cursor-pointer"
        />
        <CheckCircle
          v-else
          class="svg-circle darker ml-auto w-7 cursor-pointer"
        />
      </li>
      <li
        class="flex cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-2.5 hover:bg-gray-900"
        :class="{
          'text-gray-500': listType !== 'individual',
        }"
        @click="() => selectType('individual')"
      >
        <SvgoIndividual :class="`${listType === 'individual' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[20px] h-[20px]`" />
        Individual view
        <CheckCircle
          v-if="listType === 'individual'"
          class="success-circle ml-auto w-7 cursor-pointer"
        />
        <CheckCircle
          v-else
          class="svg-circle darker ml-auto w-7 cursor-pointer"
        />
      </li>
    </ul>
    <ul class="w-full rounded-5 bg-gray-850 p-[6px]">
      <li
        class="flex items-center justify-between gap-2.5 rounded-[14px] px-3 pb-3.5 pt-1"
      >
        <span class="text-gray-400">Networks</span>
        <div
          class="cursor-pointer text-green-600"
          @click="toggleAllNetworks"
        >
          {{
            networkPreference.length === availableNetworks.length ? "None" : "All"
          }}
        </div>
      </li>

      <li
        v-for="network in availableNetworks"
        :key="network.chainId"
        class="flex cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-2.5  hover:bg-gray-900"
        :class="{
          'text-gray-500': !networkPreference.includes(network.chainId),
        }"
        @click="toggleNetwork(network.chainId)"
      >
        <ChainLogo style="width: 30px; height: 30px" :chain="network.chainId" />
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
</template>
