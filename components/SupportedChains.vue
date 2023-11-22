<script setup lang="ts">
const props = defineProps<{
  maxCount?: number
  networks?: Network[]
  stroke?: boolean
}>()
const { safeAddress, networkOrderedBySumTokens } = useAvocadoSafe()

const actualNetworks = computed(() => {
  if (props.networks)
    return props.networks

  return networkOrderedBySumTokens.value
})

const visibleNetworks = computed(() => {
  if (props.maxCount)
    return actualNetworks.value.slice(0, props.maxCount)

  return actualNetworks.value
})
</script>

<template>
  <ul class="grid grid-cols-4 gap-5">
    <li
      v-for="network in visibleNetworks"
      :key="network.chainId"
      v-tippy="{
        arrow: true,
        arrowType: 'round',
        animation: 'fade',
        content: network.name,
      }"
    >
      <a
        v-if="safeAddress"
        target="_blank"
        :href="getExplorerUrl(network.chainId, `/address/${safeAddress}`)"
      >
        <ChainLogo
          :stroke="false"
          class="h-6.5 w-6.5 sm:h-6 sm:w-6"
          :chain="network.chainId"
        />
      </a>

      <ChainLogo
        v-else
        :stroke="stroke"
        class="h-6.5 w-6.5 sm:h-6 sm:w-6"
        :chain="network.chainId"
      />
    </li>
    <button
      v-if="props.maxCount && actualNetworks.length > props.maxCount" class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white"
      @click="openSupportedNetworks(actualNetworks)"
    >
      +{{ actualNetworks.length - props.maxCount }}
    </button>
  </ul>
</template>
