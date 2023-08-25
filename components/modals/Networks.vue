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
          'dark:text-white text-slate-900': isHideZeroBalances,
        }"
        class="text-sm text-slate-400 inline-flex gap-2.5 items-center justify-center w-full"
        @click="isHideZeroBalances = !isHideZeroBalances"
      >
        Hide 0 Balances

        <CheckCircle
          :class="[
            { 'success-circle text-white': isHideZeroBalances },
            { 'svg-circle darker': !isHideZeroBalances },
          ]"
          class="w-4 h-4"
        />
      </button>
    </ClientOnly>
    <ul class="rounded-5 p-[6px] bg-slate-50 dark:bg-gray-850 w-full">
      <li
        class="flex items-center justify-between gap-2.5 pt-1 pb-3.5 px-3 rounded-[14px]"
      >
        <span class="text-slate-400">Views</span>
      </li>

      <li
        class="flex items-center gap-3.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer py-2.5 px-3 rounded-[14px]"
        :class="{
          'dark:text-slate-500 text-slate-400': listType !== 'group',
        }"
        @click="() => selectType('group')"
      >
        <SvgoGroup :class="`${listType === 'group' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[22px] h-[22px]`" />
        Group view
        <CheckCircle
          v-if="listType === 'group'"
          class="success-circle cursor-pointer w-7 ml-auto"
        />
        <CheckCircle
          v-else
          class="svg-circle darker cursor-pointer w-7 ml-auto"
        />
      </li>
      <li
        class="flex items-center gap-3.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer py-2.5 px-3 rounded-[14px]"
        :class="{
          'dark:text-slate-500 text-slate-400': listType !== 'individual',
        }"
        @click="() => selectType('individual')"
      >
        <SvgoIndividual :class="`${listType === 'individual' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[20px] h-[20px]`" />
        Individual view
        <CheckCircle
          v-if="listType === 'individual'"
          class="success-circle cursor-pointer w-7 ml-auto"
        />
        <CheckCircle
          v-else
          class="svg-circle darker cursor-pointer w-7 ml-auto"
        />
      </li>
    </ul>
    <ul class="rounded-5 p-[6px] bg-slate-50 dark:bg-gray-850 w-full">
      <li
        class="flex items-center justify-between gap-2.5 pt-1 pb-3.5 px-3 rounded-[14px]"
      >
        <span class="text-slate-400">Networks</span>
        <div
          class="text-green-600 cursor-pointer"
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
        class="flex items-center gap-3.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer py-2.5 px-3 rounded-[14px]"
        :class="{
          'dark:text-slate-500 text-slate-400': !networkPreference.includes(network.chainId),
        }"
        @click="toggleNetwork(network.chainId)"
      >
        <ChainLogo style="width: 30px; height: 30px" :chain="network.chainId" />
        {{ network.name }}
        <CheckCircle
          v-if="networkPreference.includes(network.chainId)"
          class="success-circle cursor-pointer w-7 ml-auto"
        />
        <CheckCircle
          v-else
          class="svg-circle darker cursor-pointer w-7 ml-auto"
        />
      </li>
    </ul>
  </div>
</template>
