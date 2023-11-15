<script setup lang="ts">
import Fuse from 'fuse.js'

const { allSafes, mainSafe, selectedSafe, safeAddress } = storeToRefs(useSafe())
const { userToggleHideLegacy, displayLegacySafe } = useAccountState()

const search = ref('')
const searcInputFocused = ref(false)

watch(userToggleHideLegacy, () => {
  if (selectedSafe.value?.multisig === 0) {
    safeAddress.value = mainSafe.value?.safe_address
    selectedSafe.value = mainSafe.value
  }
})

const filteredSafes = computed(() => {
  if (!search.value)
    return allSafes.value

  const safesWithName = allSafes.value.map((i) => {
    return {
      ...i,
      name: useLocalStorage(`safe-label-${i.safe_address}`, '').value,
    }
  })

  const fuse = new Fuse(safesWithName || [], {
    keys: ['name', 'safe_address'],
    threshold: 0.5,
  })

  const result = fuse.search(search.value)

  return result.map(i => i.item)
})
</script>

<template>
  <div>
    <ModalTitle class="border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <template #icon>
        $
      </template>
      <template #title>
        Your Wallets
      </template>
      <template #subtitle>
        Manage your wallets and use all the features of Avocado!
      </template>
    </ModalTitle>
    <div class="flex flex-col gap-2.5 px-5 pb-7.5 pt-4 sm:px-7.5">
      <div class="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
        <span class="text-sm">
          All Wallets
        </span>
        <div class="flex items-center gap-5">
          <span class="text-sm">
            <CommonCheckbox v-model="userToggleHideLegacy">
              <template #label>
                Show legacy wallet
              </template>
            </CommonCheckbox>
          </span>
          <button class="flex items-center gap-2 text-sm">
            <div class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple">
              <SvgoPlus class="h-1.5 w-1.5" />
            </div>
            Create new Multisig
          </button>
        </div>
      </div>
      <CommonInput
        v-model="search"
        placeholder="Search name, address" container-classes="rounded-[40px] !px-4" input-classes="!py-2.5" type="search"
        @input-blur="searcInputFocused = false"
        @input-focus="searcInputFocused = true"
      >
        <template #prefix>
          <SvgoSearch class="mr-2" />
        </template>
      </CommonInput>
      <div class="grid min-h-[220px] grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2 sm:gap-4">
        <TransitionGroup :appear="false" :name="!searcInputFocused ? 'wallet-list' : ''">
          <template v-for="safe in filteredSafes" :key="safe.safe_address">
            <div v-if="safe.multisig === 0 ? displayLegacySafe : true">
              <WalletItem detailed :safe="safe" />
            </div>
          </template>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>
