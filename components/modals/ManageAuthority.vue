<script lang="ts" setup>
import Fuse from 'fuse.js'
import { storeToRefs } from 'pinia'
import { lt } from 'semver'

interface Props {
  authority: IAuthority
  chainIds?: number[]
  isNewAuthority?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  chainIds: () => [],
})

const emit = defineEmits(['destroy'])

const enable = ref(props.isNewAuthority || false)

const { selectedSafe } = storeToRefs(useAuthorities())

const selectedChainIds = ref<number[]>(toRaw(props.chainIds))
const searchQuery = ref('')

function toggleNetwork(network: Network) {
  const index = selectedChainIds.value.indexOf(network.chainId)

  if (index === -1)
    selectedChainIds.value.push(network.chainId)
  else
    selectedChainIds.value.splice(index, 1)
}

function isSelected(network: Network) {
  return selectedChainIds.value.includes(network.chainId)
}

const filteredNetworks = computed(() => {
  const networks = availableNetworks.filter((n) => {
    if (!enable.value)
      return props.authority.chainIds?.includes(String(n.chainId))

    const version = selectedSafe.value?.version[n.chainId] || '0.0.0'

    const isAlreadyAdded = !props.authority.chainIds?.includes(String(n.chainId))
    const isNotSupported = lt(version, '3.0.0')

    return isAlreadyAdded && !isNotSupported
  })

  if (!searchQuery.value)
    return networks

  const fuse = new Fuse(networks, {
    keys: ['name'],
    threshold: 0.2,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})

watch(enable, () => {
  selectedChainIds.value = []
})

function handleContinue() {
  emit('destroy')
  openEstimateAuthorityModal(props.authority, selectedChainIds.value, !enable.value)
}
</script>

<template>
  <div class="flex items-center justify-center gap-5 flex-col mb-7.5">
    <AuthorityAvatar
      :address="authority.address"
      class="-mr-2"
    />
    <div class="dark:bg-gray-850 bg-slate-50 rounded-5 px-2.5 py-2 text-slate-400 flex items-center text-xs">
      {{ shortenHash(authority.address) }}
    </div>
    <h1 class="text-lg leading-5">
      Manage Networks
    </h1>
    <h2 class="text-slate-400 font-medium text-xs">
      Enable networks to grant access to Funds.
    </h2>
  </div>
  <div class="flex flex-col gap-2.5">
    <CommonInput
      v-model="searchQuery"
      name="Network Search"
      type="search"
      placeholder="Search name"
      input-classes="!py-3 text-sm"
      class="!rounded-[14px]"
    >
      <template #prefix>
        <SvgoSearch class="mr-2 shrink-0" />
      </template>
    </CommonInput>
    <div class="dark:bg-gray-850 pt-4 bg-slate-50 rounded-5 sm:min-h-[100px] sm:max-h-[380px] overflow-auto scroll-style">
      <div class="w-full justify-between flex px-6">
        <button :class="enable ? 'text-white' : 'text-slate-400'" class="flex-1 text-center font-medium" @click="enable = true">
          Enable
        </button>
        <button :class="!enable ? 'text-white' : 'text-slate-400'" class="text-slate-400 flex-1 text-center font-medium" @click="enable = false">
          Disable
        </button>
      </div>

      <!-- <div v-if="!!authority.chainIds?.length" class="px-6">
        <ul class="flex flex-col gap-5">
          <li v-for="chainId in authority.chainIds" :key="chainId" class="flex items-center justify-between w-full text-slate-400">
            <span class="flex items-center gap-3 text-sm">
              <ChainLogo class="w-7 h-7" :chain="chainId" />
              {{ chainIdToName(chainId) }}
            </span>
            <button v-tippy="`Delete authority on ${chainIdToName(chainId)}`" @click="handleDeleteAuthority(Number(chainId))">
              <SvgoErrorCircle class="text-white w-5 h-5" />
            </button>
          </li>
        </ul>
      </div> -->
      <!-- <hr v-if="!!authority.chainIds?.length" class="border-slate-150 dark:border-slate-800 mt-5"> -->
      <ul v-if="!!filteredNetworks.length" class="flex flex-col py-2 px-4">
        <li v-for="network in filteredNetworks" :key="network.chainId">
          <button :class="isSelected(network) ? 'dark:text-white text-slate-900' : ''" class="flex items-center justify-between w-full hover:bg-slate-150 py-2 text-slate-400 px-2 rounded-[14px] hover:dark:bg-slate-800" @click="toggleNetwork(network)">
            <span class="flex items-center gap-3 text-sm">
              <ChainLogo class="w-7 h-7" :chain="network.chainId" />
              {{ network.name }}
            </span>

            <SvgoCheckCircle
              :class="isSelected(network) ? 'success-circle' : 'svg-circle darker text-slate-500'"
              class="w-5 h-5"
            />
          </button>
        </li>
      </ul>
      <p v-else class="text-sm text-center p-4 text-slate-400 font-medium">
        No networks available to  {{ enable ? 'enable' : 'disable' }}
      </p>
    </div>
    <CommonButton :color="enable ? 'primary' : 'red'" :disabled="!selectedChainIds.length" size="lg" class="w-full justify-center" @click="handleContinue">
      {{ enable ? 'Enable Chains' : 'Disable Chains' }}
    </CommonButton>
  </div>
</template>
