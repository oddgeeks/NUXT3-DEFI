<script lang="ts" setup>
import WorldSVG from '~/assets/images/icons/world.svg'

const { safeAddress } = useAvocadoSafe()
const { sortedNetworks } = useNetworks()

const suffix = computed<any>(() => {
  if (safeAddress.value)
    return `/address/${safeAddress.value}`
})
</script>

<template>
  <form>
    <div class="flex flex-col items-center gap-7.5 mb-7.5">
      <WorldSVG />
      <h1 class="text-lg text-center leading-5">
        All Supported EVM Networks
      </h1>
    </div>
    <ul class="flex flex-col gap-5 bg-slate-50 dark:bg-gray-850 px-5 py-4 rounded-5">
      <li
        v-for="network in sortedNetworks"
        :key="network.chainId"
      >
        <a
          target="_blank"
          class="flex items-center gap-3"
          :href="getExplorerUrl(network.chainId, suffix)"
        >
          <ChainLogo
            :stroke="false"
            class="w-[26px] h-[26px]"
            :chain="network.chainId"
          />
          <span>{{ network.name }}</span>
        </a>
      </li>
    </ul>
  </form>
</template>
