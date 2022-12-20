<script setup>

const { tokenBalances, safeAddress } = useAvocadoSafe();
const { account } = useWeb3();
</script>
<template>
    <div class="relative flex-1">
      <div class="bg-gray-850 rounded-5 h-full w-full">
        <div
          class="overflow-y-auto absolute inset-0 flex-1 scroll-style"
          :class="{ blur: tokenBalances.length === 0 }"
        >
          <table class="table w-full">
            <tbody class="divide-y divide-slate-800">
              <template v-if="tokenBalances.length > 0">
                <BalanceRow
                  v-for="tokenBalance in tokenBalances"
                  :token-balance="tokenBalance"
                />
              </template>

              <template v-else>
                <LoadingBalanceRow v-for="i in 8"/>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!account"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p class="font-semibold text-lg">
            Connect your wallet to see the balances
          </p>

          <div class="w-28">
            <Web3Button button-only />
          </div>
        </div>
      </div>
    </div>
</template>
