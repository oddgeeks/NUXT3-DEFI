<script setup lang="ts">
import CheckCircle from '~/assets/images/icons/check-circle.svg'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'

const props = defineProps({
  networks: {
    type: Array as PropType<number[]>,
    required: true,
  },
  filters: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:networks'])

const allNetworks = props.networks.map(n => getNetworkByChainId(n))

const networkPreference = computed({
  get() {
    return props.networks || []
  },
  set(value) {
    emit('update:networks', value)
  },
})

function toggleNetwork(network: number) {
  if (networkPreference.value.includes(network))
    networkPreference.value = networkPreference.value.filter(n => n !== network)
  else
    networkPreference.value = [...networkPreference.value, network]
}

function toggleAllNetworks() {
  if (networkPreference.value.length === allNetworks.length)
    networkPreference.value = []
  else
    networkPreference.value = allNetworks.map(n => n.chainId)
}
</script>

<template>
  <div class="flex items-center space-x-4">
    <ClientOnly>
      <div
        v-if="networkPreference.length > 0"
        class="flex align-self-end items-center"
      >
        <ChainLogo
          v-for="network in Array.from(networkPreference).slice(0, 3)"
          :key="network"
          style="width: 22px; height: 22px"
          class="-ml-2 first:ml-0"
          stroke
          :chain="network"
        />
        <div
          v-if="networkPreference.length > 3"
          style="width: 22px; height: 22px"
          class="bg-green-500 rounded-full text-xs flex items-center justify-center -ml-2 border dark:border-slate-900 border-gray-50"
        >
          {{ networkPreference.length - 3 }}
        </div>
      </div>
    </ClientOnly>
    <button
      v-if="filters"
      class="text-sm inline-flex sm:hidden items-center gap-2"
      @click="openNetworksModal"
    >
      Filters
      <ChevronDownSVG class="text-slate-400 w-[14px] h-[14px] -rotate-90" />
    </button>
    <Popover
      as="div" :class="`relative z-20 gap-4 items-center ${!filters ? 'flex' : 'hidden sm:flex'}`"
    >
      <PopoverButton class="text-sm flex items-center gap-2 h-7.5">
        Networks
        <ChevronDownSVG class="text-slate-400 w-[14px] h-[14px]" />
      </PopoverButton>
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <PopoverPanel
          as="ul"
          class="absolute w-[220px] sm:left-1/2 -left-4 border-2 rounded-5 p-[6px] -translate-x-1/2 bg-slate-50 dark:bg-gray-850 top-8 border-slate-150 dark:border-slate-700"
        >
          <li
            class="flex items-center justify-between gap-2.5 text-sm py-1 px-3 rounded-[14px]"
          >
            <span class="text-slate-400 text-[11px]">Networks</span>
            <div
              class="text-green-600 cursor-pointer select-none text-[11px]"
              @click="toggleAllNetworks"
            >
              {{
                allNetworks.length === networkPreference.length
                  ? "Deselect all"
                  : "Select all"
              }}
            </div>
          </li>

          <li
            v-for="network in allNetworks"
            :key="network.chainId"
            class="flex items-center gap-2.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer text-sm py-2.5 px-3 rounded-[14px]"
            @click="toggleNetwork(network.chainId)"
          >
            <ChainLogo
              style="width: 22px; height: 22px"
              :chain="network.chainId"
            />
            {{ network.name }}
            <CheckCircle
              v-if="networkPreference.some(i => i === network.chainId)"
              class="success-circle cursor-pointer w-5 ml-auto"
            />
            <CheckCircle
              v-else
              class="svg-circle darker cursor-pointer w-5 ml-auto"
            />
          </li>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>
