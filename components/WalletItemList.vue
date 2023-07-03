<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { active, deactivate, account, connector } = useWeb3()
const { safes, mainSafe, multiSigSafe } = storeToRefs(useAuthorities())
const { gasBalance, mainSafeAddress } = storeToRefs(useSafe())

const filteredSafes = computed(() => {
  if (!safes.value)
    return []

  return safes.value.filter(safe => safe.safe_address !== actualMainSafe.value?.safe_address && safe.safe_address !== multiSigSafe.value?.safe_address)
})

const actualMainSafe = computed(() => {
  if (mainSafe.value) { return mainSafe.value }
  else {
    return {
      safe_address: mainSafeAddress.value,
      authorities: {},
      created_at: new Date().toString(),
      deployed: {},
      fully_deployed: 0,
      id: 0,
      owner_address: account.value,
      updated_at: new Date().toString(),
      version: {},
      multisig: 0,
      signers: {},
    } as ISafe
  }
})
</script>

<template>
  <div class="flex flex-col">
    <div v-if="actualMainSafe">
      <h2 class="text-xs mb-3">
        Generated wallets
      </h2>
      <div class="flex flex-col gap-2.5">
        <WalletItem primary :safe="actualMainSafe" />
        <WalletItem v-if="multiSigSafe" primary :safe="multiSigSafe" />
      </div>
    </div>

    <div v-if="!!filteredSafes?.length" class="mt-5">
      <h2 class="text-xs mb-3">
        Secondary wallets
      </h2>
      <ul class="flex flex-col gap-2.5">
        <li v-for="safeItem in filteredSafes" :key="safeItem.safe_address">
          <WalletItem :safe="safeItem" />
        </li>
      </ul>
    </div>
  </div>
</template>
