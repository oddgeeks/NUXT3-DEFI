<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { toggleSelectedTokenForMigration, setTokensForMigration } = useMigration()
const { balances } = storeToRefs(useSafe())
const { account } = useWeb3()
const { tokenBalances } = useAvocadoSafe()

const tokensWithBalances = computed(() =>
  tokenBalances.value.filter(tb => toBN(tb.balance).gt(0)),
)
</script>

<template>
  <div>
    <div class="flex items-center justify-between border-b-[1px] border-slate-750 p-5 text-xs font-medium">
      <p class="text-white">
        Select tokens for migration
      </p>
      <button class="text-green-500" @click="() => setTokensForMigration(tokensWithBalances)">
        Select All
      </button>
    </div>

    <template v-if="!account || !balances">
      <MigrationLoadingBalance
        v-for="i in 4"

        :key="i"
      />
    </template>

    <MigrationTokenBalance
      v-for="token in tokensWithBalances"
      v-else
      :key="`${token.address}-${token.chainId}`"
      :token-balance="token"
      @toggle-check="() => toggleSelectedTokenForMigration(token)"
    />
  </div>
</template>
