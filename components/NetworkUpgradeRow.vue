<script setup lang="ts">
import { lt } from 'semver'

const props = defineProps<{
  network: NetworkVersion
  recentVersion: string
}>()

const { switchToAvocadoNetwork } = useNetworks()

const isUpgradeAvailable = computed(() =>
  lt(props.network.currentVersion, props.network.latestVersion),
)

async function handleUpgrade(network: NetworkVersion) {
  await switchToAvocadoNetwork()

  openUpgradeModal(network)
}
</script>

<template>
  <tr class="flex flex-col sm:table-row">
    <td class="pt-5 sm:py-[26px] pb-4 sm:pl-7.5 pl-4.5">
      <div class="flex gap-3 items-center">
        <ChainLogo class="w-11 h-11" :chain="network.chainId" />
        <div class="flex flex-col gap-1">
          <span>
            {{ network.name }}
          </span>
          <span class="text-slate-400 font-medium text-sm">
            {{ network.currentVersion }}
          </span>
        </div>
      </div>
    </td>
    <td class="hidden sm:table-cell">
      <span v-if="network.notdeployed">
        {{ recentVersion }}
      </span>
      <span v-else>
        {{ network.latestVersion }}
      </span>
    </td>
    <td class="px-4.5 pb-6.5 sm:pr-7.5 sm:pb-0 sm:pl-0 sm:w-[221px]">
      <CommonButton
        v-if="isUpgradeAvailable"
        class="w-full text-center justify-center"
        @click="handleUpgrade(network)"
      >
        Upgrade Now
      </CommonButton>
      <CommonButton
        v-else-if="network.notdeployed"
        class="!px-[19px] w-full items-center justify-center"
        @click="openDeployNetworkModal(network)"
      >
        Deploy
      </CommonButton>
      <CommonButton
        v-else
        disabled
        class="!px-[19px] w-full items-center justify-center"
      >
        Already up to date
      </CommonButton>
    </td>
  </tr>
</template>
