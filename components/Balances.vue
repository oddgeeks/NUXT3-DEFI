<script setup lang="ts">
import SearchSVG from "~/assets/images/icons/search.svg?component";

const { tokenBalances, safeAddress } = useAvocadoSafe();
const { account } = useWeb3();

const searchQuery = ref('')

const props = defineProps({
  hideZeroBalances: {
    type: Boolean,
    default: false
  }
})

const filteredBalances =  computed(() => {
  return tokenBalances.value.filter((token) => {
    if (props.hideZeroBalances && isZero(token.balance)) {
      return false
    }

    if (searchQuery.value) {
      return token.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    }

    return true
  })
})

</script>
<template>
    <div class="relative flex-1">
      <div class="dark:bg-gray-850 bg-slate-50 rounded-5 h-full w-full">
        <div
          class="overflow-y-auto overflow-x-auto md:overflow-x-hidden min-h-full max-h-[530px] flex-1 scroll-style"
          :class="{ blur: tokenBalances.length === 0 }"
        >
          <table class="table w-full">
            <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
              <tr class="border-b-0">
                <td colspan="5" class="text-left pl-7.5 pr-10 py-6">
                  <CommonInput name="Token Search" v-model="searchQuery" type="search" placeholder="Search">
                    <template #prefix>
                      <SearchSVG class="shrink-0 mr-2"/>
                    </template>
                    </CommonInput>
                </td>
              </tr>
              <template v-if="tokenBalances.length > 0">
                <BalanceRow
                  v-for="tokenBalance in filteredBalances"
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
            <Web3Button />
          </div>
        </div>
      </div>
    </div>
</template>
