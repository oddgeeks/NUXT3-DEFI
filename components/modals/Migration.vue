<template>
  <div>
    <div class="flex items-start justify-between">
      <div class="flex items-center">
        <button class="bg-green-500 p-[10px] rounded-full relative flex items-center justify-center mr-[14px]">
          <SvgoArrowRight />
        </button>
        <div>
          <h2 class="text-white text-lg font-semibold mb-1">Migrate</h2>
          <h3 class="text-slate-400 text-xs font-medium">Migrate to...</h3>
        </div>
      </div>
    </div>

    <div class="p-5 mt-[30px] border-[1px] bg-gray-850 border-slate-750 rounded-5">
      <h4 class="text-xs text-slate-400 font-medium mb-[10px]">Balances</h4>
      <div class="w-[460px] bg-gray-850 border-slate-750 rounded-5" :class="selectedTokensForMigration?.length ? 'border-[1px]' : ''">
        <MigrationTokenBalance
          v-for="token in selectedTokensForMigration"
          :key="token.address + '-' + token.chainId"
          :token-balance="(token as IBalance)"
          is-checked
          show-selected-ui
          @toggleCheck="() => toggleSelectedTokenForMigration(token)"
        />
        <div v-if="!selectedTokensForMigration?.length" class="text-xs text-slate-400 font-medium">No balances selected.</div>
      </div>

      <!-- <h4 class="text-xs text-slate-400 font-medium mb-[10px] mt-5">NFTs</h4>
      <div>
      </div>

      <h4 class="text-xs text-slate-400 font-medium mb-[10px] mt-5">DeFi Positions</h4>
      <div>
      </div> -->
    </div>

    <button class="py-3 !bg-green-500 hover:!bg-opacity-90 transition-all mt-5 w-full rounded-[40px]" :loading="loading" @click="migrate">
      <div class="flex items-center justify-center">
        <SvgoArrowRight class="rotate-90" />
        <span class="mx-[10px] text-sm text-white font-medium">Migrate</span>
        <SvgoArrowRight class="rotate-90" />
      </div>
    </button>

    <MigrationWalletItem class="mt-4" v-if="selectedSafe" primary :safe="selectedSafe" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

interface MigrateToModalProps {
  selectedSafe: ISafe | undefined
}

const { toggleSelectedTokenForMigration } = useTokens()
const { selectedTokensForMigration } = storeToRefs(useTokens())

defineProps<MigrateToModalProps>()
const loading = ref(false)

const migrate = () => { return '' }
</script>