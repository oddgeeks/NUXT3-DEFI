<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const props = withDefaults(defineProps<{
  position: MigrationPositions
  showSelectedUi?: boolean
}>(),
{
  showSelectedUi: false,
},
)

const emits = defineEmits(['toggleCheck'])

const { selectedDefiForMigration } = storeToRefs(useMigration())

const isChecked = computed(() => {
  const index = selectedDefiForMigration?.value?.findIndex((defi) => {
    return defi.id === props.position.id
  })
  return index > -1
})
</script>

<template>
  <div class="flex items-center border-b-[1px] border-slate-750 p-5 last:border-b-[0px]">
    <div class="relative h-[30px] shrink-0 grow-0 basis-[30px]">
      <SafeTokenLogo class="h-full w-full" :url="position.logoURI" />
      <ChainLogo
        v-tippy="chainIdToName(position.chainId)"
        :stroke="true"
        class="absolute -bottom-1 -left-1 h-[18px] w-[18px]"
        :chain="position.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="w-[90px] truncate text-sm font-medium">
        {{ position.label }}
      </div>
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm font-medium">
        {{ formatUsd(position.positions.totalSupplyInUsd) }}
      </div>
      <div class="text-xs font-medium text-slate-400">
        Supplied
      </div>
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm font-medium ">
        {{ formatUsd(position.positions.totalBorrowInUsd) }}
      </div>
      <div class="text-xs font-medium text-slate-400">
        Borrowed
      </div>
    </div>

    <input
      v-if="!props.showSelectedUi"
      type="checkbox"
      :checked="isChecked"
      class="ml-5 h-5 w-5 cursor-pointer rounded-[6px] border-0 !bg-slate-700 outline-0"
      @click="emits('toggleCheck')"
    >
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>
