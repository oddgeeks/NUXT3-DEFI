<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { toggleSelectedTokenForMigration, setTokensForMigration } = useTokens()
const { selectedTokensForMigration } = storeToRefs(useTokens())
const { balances } = storeToRefs(useSafe())
const { account } = useWeb3()
const { tokenBalances } = useAvocadoSafe()

const tokensWithBalances = computed(() =>
  tokenBalances.value.filter(tb => toBN(tb.balance).gt(0)),
)

function isChecked(token: IToken) {
  const index = selectedTokensForMigration?.value?.findIndex((selectedToken) => {
    return `${selectedToken.address}-${selectedToken.chainId}` === `${token.address}-${token.chainId}`
  })
  return index > -1
}
</script>

<template>
  <div>
    <div class="p-5 flex items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white">
      <p class="dark:text-white text-slate-900">
        Select tokens for migration
      </p>
      <button class="text-green-500" @click="() => setTokensForMigration(tokensWithBalances)">
        Select All
      </button>
    </div>

    <template v-if="!account || !tokensWithBalances.length || !balances.data">
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
      :is-checked="isChecked(token)"
      @toggle-check="() => toggleSelectedTokenForMigration(token)"
    />
  </div>
</template>
