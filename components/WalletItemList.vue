<script lang="ts" setup>
import { getAddress } from 'ethers/lib/utils'

const { mainSafe, multiSigSafe, safes, legacySafe, legacySafeAddress, safesLoading, safeAddress, selectedSafe, legacySafeHasGas } = storeToRefs(useSafe())

const userToggleHideLegacy = useLocalStorage('hide-legacy-safe', false)

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

function handleToggle() {
  userToggleHideLegacy.value = !userToggleHideLegacy.value

  if (selectedSafe.value?.safe_address === legacySafe.value?.safe_address) {
    safeAddress.value = mainSafe.value?.safe_address
    selectedSafe.value = mainSafe.value
  }
}

const displayLegacySafe = computed(() => {
  return legacySafeAddress && legacySafe && !userToggleHideLegacy.value && legacySafeHasGas
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex mb-3 justify-between items-center">
      <h2 class="text-xs font-medium items-center flex gap-3">
        Your wallets

        <SvgSpinner v-if="safesLoading" class="text-primary" />
      </h2>
      <button class="text-primary text-xs" type="button" @click="handleToggle">
        {{ !displayLegacySafe ? 'Show' : 'Hide' }} legacy safe
      </button>
    </div>
    <template v-if="!safesLoading">
      <div class="flex flex-col gap-2.5">
        <WalletItem v-if="mainSafe" v2 primary :safe="mainSafe" />
        <WalletItem v-if="displayLegacySafe" tooltip="Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever." :safe="legacySafe" />
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
