<script setup lang="ts">
const props = defineProps({
  account: String,
})

const { sortedNetworks } = useNetworks()
</script>

<template>
  <ul class="grid grid-cols-4 gap-5">
    <li
      v-for="network in sortedNetworks"
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
          class="w-[26px] h-[26px]"
          :chain="network.chainId"
        />
      </a>

      <ChainLogo
        v-else
        :stroke="false"
        class="w-[26px] h-[26px]"
        :chain="network.chainId"
      />
    </li>
  </ul>
</template>
