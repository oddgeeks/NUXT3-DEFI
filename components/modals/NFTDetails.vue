<script setup lang="ts">
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'

const props = defineProps<{
  asset: NFTData
}>()
defineEmits(['destroy'])

const [expanded, toggle] = useToggle(false)

provide('expanded', expanded)
provide('toggle', toggle)

const isContractERC1155 = computed(() => props.asset.contractType === 'ERC1155')

const disabled = computed(() => isContractERC1155.value)
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <NFTImage
      details
      img-class="sm:!h-[324px] sm:w-full"
      class="!sm:h-full"
      :asset="asset"
    />
    <template v-if="!expanded">
      <div class="flex gap-3 flex-col">
        <h1 v-if="asset.name" class="text-center text-lg leading-5 flex justify-center gap-2">
          {{ asset.name }}

          <NuxtLink external target="_blank" class="shrink-0 text-slate-750 dark:text-slate-150" :to="getExplorerUrl(asset.chainId, `/address/${asset.contractAddress}`)">
            <ExternalLinkSVG class="shrink-0 w-4" />
          </NuxtLink>
        </h1>
        <h2
          v-if="asset.collectionName"
          class="text-sm text-slate-400 font-medium text-center"
        >
          {{ asset.collectionName }}
        </h2>
      </div>
      <CommonButton :disabled="disabled" class="w-full justify-center" size="lg" @click="$emit('destroy'), openSendNFTModal(asset)">
        Send NFT
      </CommonButton>
      <p v-if="isContractERC1155" class="text-sm text-orange-400 text-center">
        ERC1155 transfer not supported yet
      </p>
    </template>
  </div>
</template>
