<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const { selectedDefiForMigration } = storeToRefs(useMigration())

const props = withDefaults(defineProps<{
  position: Positions
  showSelectedUi?: boolean
}>(),
  {
    showSelectedUi: false,
  },
)

const isChecked = computed(() => {
  const index = selectedDefiForMigration?.value?.findIndex((defi) => {
    return defi.id === props.position.id
  })
  return index > -1
})

const emits = defineEmits(['toggleCheck']);
</script>

<template>
  <div class="p-5 flex items-center border-b-[1px] last:border-b-[0px] dark:border-slate-750 border-white">
    <div class="relative basis-[30px] h-[30px] grow-0 shrink-0">
      <SafeTokenLogo class="w-full h-full" :url="position.logoURI" />
      <ChainLogo
        v-tippy="chainIdToName(position.chainId)"
        :stroke="true"
        class="w-[18px] h-[18px] absolute -left-1 -bottom-1"
        :chain="position.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm dark:text-white text-slate-900 font-medium overflow-hidden w-[90px] whitespace-nowrap text-ellipsis">{{ position.label }}</div>
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm dark:text-white text-slate-900 font-medium">{{ formatUsd(position.positions.totalSupplyInUsd) }}</div>
      <div class="text-xs text-slate-400 font-medium">Supplied</div>
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm dark:text-white text-slate-900 font-medium">{{ formatUsd(position.positions.totalBorrowInUsd) }}</div>
      <div class="text-xs text-slate-400 font-medium">Borrowed</div>
    </div>

    <input
      v-if="!props.showSelectedUi"
      type="checkbox"
      :checked="isChecked"
      class="ml-5 w-5 h-5 rounded-[6px] !bg-slate-700 border-0 outline-0 cursor-pointer"
      @click="emits('toggleCheck')"
    />
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>