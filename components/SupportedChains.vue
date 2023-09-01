<script setup lang="ts">
const props = defineProps({
  maxCount: {
    type: Number,
    required: false,
  },
})
const { safeAddress, networkOrderedBySumTokens } = useAvocadoSafe()

const visibleNetworks = computed(() => {
  if (props.maxCount)
    return networkOrderedBySumTokens.value.slice(0, props.maxCount)

  return networkOrderedBySumTokens.value
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
          class="w-6.5 sm:w-6 h-6.5 sm:h-6"
          :chain="network.chainId"
        />
      </a>

      <ChainLogo
        v-else
        :stroke="false"
        class="w-6.5 sm:w-6 h-6.5 sm:h-6"
        :chain="network.chainId"
      />
    </li>
    <button v-if="props.maxCount && availableNetworks.length > props.maxCount" class="w-6 h-6 text-xs bg-primary text-white rounded-full flex items-center justify-center" @click="openSupportedNetworks">
      +{{ availableNetworks.length - props.maxCount }}
    </button>
  </ul>
</template>
