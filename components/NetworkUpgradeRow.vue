<script setup lang="ts">
import { lt } from 'semver'
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  options: ISafeOptions
  recentVersion: string
}>()

const { switchToAvocadoNetwork } = useNetworks()
const { authorisedNetworks } = useAuthorities()
const { $t } = useNuxtApp()

const isNetworkNotAuthorised = computed(() => {
  return !authorisedNetworks.value?.find(i => String(i.chainId) == String(props.options.chainId))
})

const isUpgradeAvailable = computed(() => {
  if (lt(props.options.currentVersion, props.options.latestVersion))
    return true
},
)

async function handleUpgrade() {
  await switchToAvocadoNetwork()

  openUpgradeModal(props.options)
}
</script>

<template>
  <tr class="flex flex-col sm:table-row">
    <td class="pb-4 pl-4.5 pt-5 sm:py-[26px] sm:pl-7.5">
      <div class="flex items-center gap-3">
        <ChainLogo class="h-11 w-11" :chain="options.chainId" />
        <div class="flex flex-col gap-1">
          <span>
            {{ chainIdToName(options.chainId) }}
          </span>
          <span class="text-sm font-medium text-gray-400">
            {{ options.currentVersion }}
          </span>
        </div>
      </div>
    </td>
    <td class="hidden sm:table-cell">
      <span v-if="options.notdeployed">
        {{ recentVersion }}
      </span>
      <span v-else>
        {{ options.latestVersion }}
      </span>
    </td>
    <td class="px-4.5 pb-6.5 sm:w-[221px] sm:pb-0 sm:pl-0 sm:pr-7.5">
      <Tippy
        :content="isNetworkNotAuthorised
          ? $t('nonAuthorized', {
            network: chainIdToName(options.chainId),
          }) : undefined"
      >
        <fieldset :disabled="isNetworkNotAuthorised">
          <CommonButton
            v-if="options.notdeployed"
            class="w-full items-center justify-center !px-[19px]"
            @click="openDeployNetworkModal(options)"
          >
            Deploy
          </CommonButton>

          <CommonButton
            v-else-if="isUpgradeAvailable"
            class="w-full justify-center text-center"
            @click="handleUpgrade()"
          >
            Upgrade Now
          </CommonButton>

          <CommonButton
            v-else
            disabled
            class="w-full items-center justify-center !px-[19px]"
          >
            Already up to date
          </CommonButton>
        </fieldset>
      </Tippy>
    </td>
  </tr>
</template>
