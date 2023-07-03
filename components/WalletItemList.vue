<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { active, deactivate, account, connector } = useWeb3()
const { safes, mainSafe } = storeToRefs(useAuthorities())
const { gasBalance, mainSafeAddress } = storeToRefs(useSafe())

const actualMainSafe = computed(() => {
  if (mainSafe.value) { return mainSafe.value }
  else {
    return {
      safe_address: mainSafeAddress.value,
      authorities: {},
      created_at: new Date(),
      deployed: false,
      fully_deployed: false,
      id: 0,
      owner_address: account.value,
      updated_at: new Date(),
      version: '0.0.0',
    }
  }
})
</script>

<template>
  <div class="flex flex-col">
    <div v-if="actualMainSafe">
      <h2 class="text-xs mb-3">
        Generated wallets
      </h2>
      <WalletItem :safe="actualMainSafe" />
    </div>

    <div v-if="!!safes?.length" class="mt-5">
      <h2 class="text-xs mb-3">
        Secondary wallets
      </h2>
      <ul class="flex flex-col gap-2.5">
        <li v-for="safeItem in safes" :key="safeItem.safe_address">
          <WalletItem :safe="safeItem" />
        </li>
      </ul>
    </div>
  </div>
</template>
