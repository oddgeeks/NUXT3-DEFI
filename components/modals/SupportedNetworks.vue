<script lang="ts" setup>
import isArray from 'lodash/isArray'
import WorldSVG from '~/assets/images/icons/world.svg?component'

const props = defineProps<{
  networks?: Network[]
}>()

const { safeAddress, networkOrderedBySumTokens } = useAvocadoSafe()

const suffix = computed<any>(() => {
  if (safeAddress.value)
    return `/address/${safeAddress.value}`
})

const actualNetworks = computed(() => {
  if (isArray(props.networks))
    return props.networks

  return networkOrderedBySumTokens.value
})
</script>

<template>
  <form>
    <div class="mb-7.5 flex flex-col items-center gap-7.5">
      <WorldSVG />
      <h1 class="text-center text-lg leading-5">
        Supported EVM Networks
      </h1>
    </div>
    <ul class="flex flex-col gap-5 rounded-5 bg-gray-850 px-5 py-4">
      <li
        v-for="network in actualNetworks"
        :key="network.chainId"
      >
        <a
          target="_blank"
          class="flex items-center gap-3"
          :href="getExplorerUrl(network.chainId, suffix)"
        >
          <ChainLogo
            :stroke="false"
            class="h-[26px] w-[26px]"
            :chain="network.chainId"
          />
          <span>{{ network.name }}</span>
        </a>
      </li>
    </ul>
  </form>
</template>
