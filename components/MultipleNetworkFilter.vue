<script setup lang="ts">
import Fuse from 'fuse.js'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'

const props = defineProps({
  networks: {
    type: Array as PropType<number[]>,
    required: true,
  },
  filters: {
    type: Boolean,
    default: true,
  },
  showSupportedNetworks: {
    type: Boolean,
    default: true,
  },
  containerClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:networks'])

const search = ref('')

const allNetworks = props.showSupportedNetworks ? availableNetworks : props.networks.map(n => getNetworkByChainId(n))

const filteredNetworks = computed(() => {
  if (!search.value)
    return allNetworks

  const fuse = new Fuse(allNetworks || [], {
    keys: ['name', 'chainId'],
    threshold: 0.5,
  })

  const result = fuse.search(search.value)

  return result.map(i => i.item)
})

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
        class="align-self-end flex items-center"
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
          class="-ml-2 flex items-center justify-center rounded-full border border-gray-50 bg-green-500 text-xs dark:border-slate-900"
        >
          {{ networkPreference.length - 3 }}
        </div>
      </div>
    </ClientOnly>
    <button
      v-if="filters"
      class="inline-flex items-center gap-2 text-sm sm:hidden"
      @click="openNetworksModal"
    >
      Filters
      <ChevronDownSVG class="h-[14px] w-[14px] -rotate-90 text-gray-400" />
    </button>
    <Popover
      as="div" :class="`relative z-20 gap-4 items-center ${!filters ? 'flex' : 'hidden sm:flex'}`"
    >
      <PopoverButton class="flex h-7.5 items-center gap-2 text-sm focus-visible:outline-none">
        Networks
        <ChevronDownSVG class="h-[14px] w-[14px] text-gray-400" />
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
          as="div"
          :class="[containerClass]"
          class="absolute -left-16 top-8 w-[340px] -translate-x-1/2 rounded-5 border-1 border-slate-150 bg-slate-50 p-2 pt-0 dark:border-gray-800 dark:bg-gray-850"
        >
          <div
            class="flex items-center justify-between gap-2.5 rounded-[14px] px-3 pb-4 pt-5 text-sm"
          >
            <span class="text-sm text-gray-400">All Networks</span>
            <div
              class="cursor-pointer select-none text-sm text-green-600"
              @click="toggleAllNetworks"
            >
              {{
                allNetworks.length === networkPreference.length
                  ? "Deselect all"
                  : "Select all"
              }}
            </div>
          </div>

          <CommonInput v-model="search" autofocus placeholder="Search" name="search-input" container-classes="!px-3 mx-3 mb-2.5" input-classes="!py-1.5" type="search">
            <template #prefix>
              <SvgoSearch class="mr-2 text-gray-400" />
            </template>
          </CommonInput>

          <ul class="scroll-style max-h-[45vh] overflow-auto">
            <li
              v-for="network in filteredNetworks"
              :key="network.chainId"
              class="flex cursor-pointer items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-xs hover:bg-slate-150 hover:dark:bg-gray-900"
              @click="toggleNetwork(network.chainId)"
            >
              <ChainLogo
                style="width: 22px; height: 22px"
                :chain="network.chainId"
              />
              {{ network.name }}
              <CheckCircle
                v-if="networkPreference.some(i => i === network.chainId)"
                class="success-circle ml-auto w-5 cursor-pointer"
              />
              <CheckCircle
                v-else
                class="svg-circle darker ml-auto w-5 cursor-pointer"
              />
            </li>
          </ul>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>
