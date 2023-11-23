<script setup lang="ts">
import Fuse from 'fuse.js'
import { MultisigForwarder__factory } from '~/contracts'

const { allSafes, mainSafe, selectedSafe, safeAddress, accountCustomSafeMapping } = storeToRefs(useSafe())
const { getDefaultSafe } = useSafe()
const { userToggleShowLegacy, displayLegacySafe } = useAccountState()
const { multisigForwarderProxyAddress } = storeToRefs(useEnvironmentState())
const { getRpcProviderByChainId } = useShared()
const { account } = useWeb3()

const search = ref('')
const searcInputFocused = ref(false)

async function handleCreateMultisig() {
  try {
    const highestIndex = allSafes.value.reduce((acc, curr) => {
      if (curr.multisig_index > acc)
        return curr.multisig_index
      return acc
    }, 0)

    const provider = getRpcProviderByChainId(137)

    const multisigProvider = MultisigForwarder__factory.connect(
      multisigForwarderProxyAddress.value,
      provider,
    )

    const nextIndex = highestIndex + 1

    if (nextIndex > 4) {
      return notify({
        type: 'error',
        message: 'You can only create up to 5 wallets.',
      })
    }

    const { success } = await openDialogModal({
      type: 'question',
      title: 'Create new wallet',
      content: 'This will generate a new Multisig account owned by you',
      buttonText: 'Confirm',
      cancelButtonText: 'Cancel',
      isCancelButtonVisible: true,
      cancelButtonProps: {
        color: 'white',
      },
    })

    if (!success)
      return

    const address = await multisigProvider.computeAvocado(
      account.value,
      nextIndex,
    )

    const safeInstance = getDefaultSafe(address, 1, nextIndex)

    const mapping = accountCustomSafeMapping.value[account.value] || []

    if (mapping) {
      mapping.push(safeInstance)

      accountCustomSafeMapping.value[account.value] = mapping
    }

    notify({
      type: 'success',
      message: 'Wallet created',
    })
  }
  catch (e) {
    notify({
      type: 'error',
      message: 'Error creating wallet',
    })
  }
}

watch(userToggleShowLegacy, () => {
  if (selectedSafe.value?.multisig === 0) {
    safeAddress.value = mainSafe.value?.safe_address
    selectedSafe.value = mainSafe.value
  }
})

const filteredSafes = computed(() => {
  const safes = allSafes.value.filter((safe) => {
    return safe.multisig === 0 ? String(displayLegacySafe.value).toLowerCase() == 'true' : true
  })

  if (!search.value)
    return safes

  const safesWithName = safes.map((i) => {
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

const primarySafes = computed(() => filteredSafes.value.filter(safe => isAddressEqual(safe.owner_address, account.value)))
const secondarySafes = computed(() => filteredSafes.value.filter(safe => !isAddressEqual(safe.owner_address, account.value)))
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
            <CommonCheckbox v-model="userToggleShowLegacy">
              <template #label>
                Show legacy wallet
              </template>
            </CommonCheckbox>
          </span>
          <button class="flex items-center gap-2 text-sm" @click="handleCreateMultisig">
            <div class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple">
              <SvgoPlus />
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
      <ClientOnly>
        <template v-if="primarySafes.length">
          <h2 class="text-sm">
            Primary Wallets
          </h2>
          <div class="grid min-h-[84px] grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2 sm:gap-4">
            <TransitionGroup :appear="false" :name="!searcInputFocused ? 'wallet-list' : ''">
              <WalletItem v-for="safe in primarySafes" :key="safe.safe_address" detailed :safe="safe" />
            </TransitionGroup>
          </div>
        </template>

        <template v-if="secondarySafes.length">
          <h2 class="text-sm">
            Secondary Wallets
          </h2>
          <div class="grid min-h-[84px] grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2 sm:gap-4">
            <TransitionGroup :appear="false" :name="!searcInputFocused ? 'wallet-list' : ''">
              <WalletItem v-for="safe in secondarySafes" :key="safe.safe_address" detailed :safe="safe" />
            </TransitionGroup>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
