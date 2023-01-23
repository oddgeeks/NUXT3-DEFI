<script setup lang="ts">
import { RPC_URLS } from '~~/connectors';
const { safeAddress } = useAvocadoSafe()

const supportedChains = computed(() => Object.keys(RPC_URLS).filter(i => i !== '634').map((chainId) => {
  return {
    id: chainId,
    name: chainIdToName(chainId),
  }
}));

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