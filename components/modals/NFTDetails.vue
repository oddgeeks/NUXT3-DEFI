<script setup lang="ts">
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'

const props = defineProps<{
  asset: NFTData
}>()
defineEmits(['destroy'])

const { checkNetworkIsAuthorised } = useAuthorities()
const { $t } = useNuxtApp()

const [expanded, toggle] = useToggle(false)

provide('expanded', expanded)
provide('toggle', toggle)

const isNotAuthorised = computed(() => {
  return !checkNetworkIsAuthorised(props.asset.chainId)
})
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <NFTImage
      details
      img-class="sm:!h-[350px] sm:w-full object-contain"
      class="!sm:h-full"
      :asset="asset"
    />
    <template v-if="!expanded">
      <div class="flex flex-col gap-3">
        <h1 v-if="asset.name" class="flex justify-center gap-2 text-center text-lg leading-5">
          {{ asset.name }}

          <NuxtLink external target="_blank" class="shrink-0 text-slate-150" :to="getExplorerUrl(asset.chainId, `/address/${asset.contractAddress}`)">
            <ExternalLinkSVG class="w-4 shrink-0" />
          </NuxtLink>
        </h1>
        <h2
          v-if="asset.collectionName"
          class="text-center text-sm font-medium text-gray-400"
        >
          {{ asset.collectionName }}
        </h2>
      </div>
      <details v-if="asset.attributes?.length" class="r group rounded-2xl bg-gray-850 ring-2 ring-gray-800">
        <summary
          class="flex cursor-pointer items-center justify-between px-4 py-[14px] text-sm font-semibold"
        >
          Traits
          <ChevronDownSVG
            class="w-5 text-gray-400 group-open:rotate-180"
          />
        </summary>

        <div class="scroll-style max-h-[300px] overflow-y-auto border-t border-gray-800 px-4 py-[14px]">
          <ul class="grid grid-cols-2 items-baseline gap-2">
            <li v-for="attr in asset.attributes" :key="attr.value" class="flex flex-col rounded-[14px]  bg-gray-900 px-[14px] py-2">
              <span class="text-[10px] leading-4 text-gray-400"> {{ attr.type }}</span>
              <span class="text-xs leading-5">{{ attr.value }}</span>
            </li>
          </ul>
        </div>
      </details>
      <div
        v-tippy="{
          content: isNotAuthorised
            ? $t('nonAuthorized', {
              network: chainIdToName(asset.chainId),
            })
            : undefined,
        }"
      >
        <CommonButton :disabled="isNotAuthorised" class="w-full justify-center" size="lg" @click="$emit('destroy'), openSendNFTModal(asset)">
          Send NFT
        </CommonButton>
      </div>
    </template>
  </div>
</template>
