<script setup lang="ts">
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'

const props = defineProps<{
  asset: NFTData
}>()
defineEmits(['destroy'])

const { checkNetworkIsAuthorised } = useAuthorities()

const [expanded, toggle] = useToggle(false)

provide('expanded', expanded)
provide('toggle', toggle)

const isNotAuthorised = computed(() => {
  return !checkNetworkIsAuthorised(props.asset.chainId)
})

// const isContractERC1155 = computed(() => props.asset.contractType === 'ERC1155')

// const disabled = computed(() => isContractERC1155.value)
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
        <h1 v-if="asset.name" class="flex justify-center gap-2 text-lg leading-5 text-center">
          {{ asset.name }}

          <NuxtLink external target="_blank" class="shrink-0 text-slate-750 dark:text-slate-150" :to="getExplorerUrl(asset.chainId, `/address/${asset.contractAddress}`)">
            <ExternalLinkSVG class="w-4 shrink-0" />
          </NuxtLink>
        </h1>
        <h2
          v-if="asset.collectionName"
          class="text-sm font-medium text-center text-slate-400"
        >
          {{ asset.collectionName }}
        </h2>
      </div>
      <details v-if="asset.attributes?.length" class="dark:ring-slate-800 ring-slate-150 bg-slate-50 dark:bg-gray-850 ring-2 rounded-2xl group">
        <summary
          class="text-sm font-semibold cursor-pointer py-[14px] px-4 flex items-center justify-between"
        >
          Traits
          <ChevronDownSVG
            class="w-5 text-slate-400 group-open:rotate-180"
          />
        </summary>

        <div class="border-t dark:border-slate-800 px-4 py-[14px] max-h-[300px] overflow-y-auto scroll-style">
          <ul class="grid items-baseline grid-cols-2 gap-2">
            <li v-for="attr in asset.attributes" :key="attr.value" class="dark:bg-slate-800 bg-white flex flex-col rounded-[14px] px-[14px] py-2">
              <span class="text-[10px] leading-4 text-slate-400"> {{ attr.type }}</span>
              <span class="text-xs leading-5">{{ attr.value }}</span>
            </li>
          </ul>
        </div>
      </details>
      <div v-tippy="isNotAuthorised ? `You are not authorized to interact with tokens on ${chainIdToName(asset.chainId)}` : undefined">
        <CommonButton :disabled="isNotAuthorised" class="justify-center w-full" size="lg" @click="$emit('destroy'), openSendNFTModal(asset)">
          Send NFT
        </CommonButton>
      </div>
    </template>
  </div>
</template>
