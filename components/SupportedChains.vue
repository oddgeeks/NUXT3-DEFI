<script setup lang="ts">
const props = defineProps({
  account: String,
  maxCount: {
    type: Number,
    required: false,
  },
})

const { sortedNetworks } = useNetworks()

const visibleNetworks = computed(() => {
  if (props.maxCount)
    return sortedNetworks.value.slice(0, props.maxCount)

  return sortedNetworks.value
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
        v-if="props.account"
        target="_blank"
        :href="getExplorerUrl(network.chainId, `/address/${props.account}`)"
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
    <div v-if="props.maxCount && sortedNetworks.length > props.maxCount" class="w-6 h-6 text-xs bg-primary text-white rounded-full flex items-center justify-center">
      +{{ sortedNetworks.length - props.maxCount }}
    </div>
  </ul>
</template>
