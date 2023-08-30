<script setup lang="ts">
import { lt } from 'semver'
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  options: ISafeOptions
  recentVersion: string
}>()

const { switchToAvocadoNetwork } = useNetworks()
const { authorisedNetworks } = useAuthorities()

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
    <td class="pt-5 sm:py-[26px] pb-4 sm:pl-7.5 pl-4.5">
      <div class="flex gap-3 items-center">
        <ChainLogo class="w-11 h-11" :chain="options.chainId" />
        <div class="flex flex-col gap-1">
          <span>
            {{ chainIdToName(options.chainId) }}
          </span>
          <span class="text-slate-400 font-medium text-sm">
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
    <td class="px-4.5 pb-6.5 sm:pr-7.5 sm:pb-0 sm:pl-0 sm:w-[221px]">
      <Tippy :content="isNetworkNotAuthorised ? `You are not authorized to interact on ${chainIdToName(options.chainId)}` : undefined">
        <fieldset :disabled="isNetworkNotAuthorised">
          <CommonButton
            v-if="options.notdeployed"
            class="!px-[19px] w-full items-center justify-center"
            @click="openDeployNetworkModal(options)"
          >
            Deploy
          </CommonButton>

          <CommonButton
            v-else-if="isUpgradeAvailable"
            class="w-full text-center justify-center"
            @click="handleUpgrade()"
          >
            Upgrade Now
          </CommonButton>

          <CommonButton
            v-else
            disabled
            class="!px-[19px] w-full items-center justify-center"
          >
            Already up to date
          </CommonButton>
        </fieldset>
      </Tippy>
    </td>
  </tr>
</template>
