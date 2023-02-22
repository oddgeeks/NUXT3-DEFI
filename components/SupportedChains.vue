<script setup lang="ts">
const { safeAddress } = useAvocadoSafe()

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
  <div class="p-5 dark:bg-gray-850 bg-slate-50 rounded-5.5">
    <ul class="grid grid-cols-4 gap-5">
      <li v-tippy="{
        arrow: true,
        arrowType: 'round',
        animation: 'fade',
        content: chain.name,
      }" :key="chain.id" v-for="chain in supportedChains">
        <a v-if="safeAddress" target="_blank" :href="getExplorerUrl(chain.id, `/address/${safeAddress}`)">
          <ChainLogo :stroke="false" class="w-[26px] h-[26px]" :chain="chain.id" />
        </a>

        <ChainLogo v-else :stroke="false" class="w-[26px] h-[26px]" :chain="chain.id" />
      </li>
    </ul>
  </div>
</template>