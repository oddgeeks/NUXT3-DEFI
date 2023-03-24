<script setup lang="ts">
const props = defineProps({
  account: String,
});

const supportedChains = [
  { "id": "1", "name": "Mainnet" },
  {
    "id": "137",
    "name": "Polygon"
  },
  {
    "id": "42161",
    "name": "Arbitrum"
  },
  {
    "id": "10",
    "name": "Optimism"
  },
  {
    "id": "56",
    "name": "BSC"
  },
  { "id": "43114", "name": "Avalanche" },
  {
    "id": "100",
    "name": "Gnosis"
  },
]
</script>

<template>
  <ul class="grid grid-cols-4 gap-5">
    <li v-tippy="{
      arrow: true,
      arrowType: 'round',
      animation: 'fade',
      content: chain.name,
    }" :key="chain.id" v-for="chain in supportedChains">
      <a v-if="props.account" target="_blank" :href="getExplorerUrl(chain.id, `/address/${props.account}`)">
        <ChainLogo :stroke="false" class="w-[26px] h-[26px]" :chain="chain.id" />
      </a>

      <ChainLogo v-else :stroke="false" class="w-[26px] h-[26px]" :chain="chain.id" />
    </li>
  </ul>
</template>
