<script lang="ts" setup>
import { getAddress } from 'ethers/lib/utils'

const { mainSafe, multiSigSafe, safes, legacySafe, legacySafeAddress, safesLoading } = storeToRefs(useSafe())

const filteredSafes = computed(() => {
  if (!safes.value)
    return []

  const excludedAddresses = [
    mainSafe.value?.safe_address,
    multiSigSafe.value?.safe_address,
    legacySafe.value?.safe_address,
  ].filter(address => !!address)

  return safes.value.filter(safe => !excludedAddresses.includes(getAddress(safe.safe_address)))
})
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xs mb-3 font-medium items-center flex gap-3">
      Your wallets

      <SvgSpinner v-if="safesLoading" class="text-primary" />
    </h2>
    <template v-if="!safesLoading">
      <div class="flex flex-col gap-2.5">
        <WalletItem v-if="legacySafeAddress && legacySafe" tooltip="Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever." :safe="legacySafe" />
        <WalletItem v-if="mainSafe" v2 primary :safe="mainSafe" />
        <WalletItem v-if="multiSigSafe" primary :safe="multiSigSafe" />
      </div>

      <div v-if="!!filteredSafes?.length" class="mt-5">
        <h2 class="text-xs mb-3 font-medium">
          Other wallets
        </h2>
        <ul class="flex flex-col gap-2.5">
          <li v-for="safeItem in filteredSafes" :key="safeItem.safe_address">
            <WalletItem :safe="safeItem" />
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
