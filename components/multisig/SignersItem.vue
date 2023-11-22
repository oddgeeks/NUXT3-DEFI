<script setup lang="ts">
import { wait } from '@instadapp/utils'
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  multisigSafe: ISafe
  item: IAvailableSigner
  chainId: string | number
}>()

const { account } = useWeb3()
const { isAccountCanSign, getRequiredSigner } = useMultisig()
const { changeThreshold } = useAvocadoSafe()

const currentNetwork = computed(() => availableNetworks.find(i => i.chainId == props.chainId))

const { selectedSafe, safeOptions, balances, optionsLoading } = storeToRefs(useSafe())

const route = useRoute()

const isSafeDoesNotMatch = computed(() => {
  const safe = route.params.safe as string
  if (!selectedSafe.value || !safe)
    return true

  return getAddress(safe) !== getAddress(selectedSafe.value?.safe_address)
})

const currentThreshold = computed(() => {
  const option = safeOptions.value.find(i => i.chainId == props.chainId)

  return option?.threshold
})

async function getActualThreshold() {
  if (!selectedSafe.value || !currentNetwork)
    return

  const safe = route.params.safe as string

  if (isSafeDoesNotMatch.value) {
    await until(() => balances.value.loading).toMatch(s => !s)
    await until(optionsLoading).toMatch(s => !!s)
    await until(optionsLoading).toMatch(s => !s)
    await wait(500)

    return getRequiredSigner(safe, props.chainId)
  }
}

const throlledGetActualThreshold = useThrottleFn(getActualThreshold, 1000)

const { data: threshold } = useAsyncData(`${route.params.safe}-${props.chainId}-threshold`, async () => {
  return throlledGetActualThreshold()
}, {
  watch: [selectedSafe, isSafeDoesNotMatch],
  immediate: true,
  server: false,
  lazy: true,
})

const actualThreshold = computed(() => {
  return isSafeDoesNotMatch.value ? threshold.value : currentThreshold.value
})

async function handleTresholdChange(chainId: string | number) {
  const { success, payload } = await openUpdateThresholdModal(chainId, 0)

  if (success && payload) {
    const metadata = encodeChangeThresholdMetadata(payload)

    const txHash = await changeThreshold({
      threshold: payload,
      chainId,
    })

    if (txHash) {
      logActionToSlack({
        account: account.value,
        message: generateSlackMessage(metadata, chainId),
        action: 'change-threshold',
        txHash,
        chainId: String(chainId),
      })

      showPendingTransactionModal({
        hash: txHash,
        chainId,
      })
    }
  }
}
</script>

<template>
  <details v-if="currentNetwork" class="group rounded-[25px] bg-gray-850 text-sm">
    <summary class="flex cursor-pointer flex-wrap items-center justify-between gap-4.5 border-gray-800 p-[18px] last:border-b-0 group-open:border-b-1 sm:gap-0 sm:px-7.5 sm:py-6.5">
      <h2 class="flex w-full items-center gap-3 sm:w-auto">
        <ChainLogo class="h-7.5 w-7.5" :chain="item.chainId" />
        {{ chainIdToName(item.chainId) }}
        <SvgoChevronDown class="ml-auto block w-5 shrink-0 text-gray-400 group-open:rotate-180 sm:hidden" />
      </h2>
      <div class="flex flex-1 flex-wrap items-center justify-between sm:gap-[142px]">
        <div class="flex flex-1 items-center justify-end gap-5 text-sm font-medium text-gray-400 sm:gap-[100px]">
          <div v-if="!actualThreshold" class="loading-box h-5 w-36 rounded-5" />
          <span v-else class="flex items-center gap-2.5">
            <SvgoUsers class="shrink-0" />
            {{ item.addresses.length }}
            <span class="hidden sm:block">total signers</span>
            <span class="block whitespace-nowrap sm:hidden">total sign.</span>
          </span>
          <div v-if="!actualThreshold" class="loading-box h-5 w-36 rounded-5" />
          <span v-else class="flex items-center gap-2.5">
            <SvgoStamp />
            {{ actualThreshold }}
            <span class="hidden sm:block">confirmations required</span>
            <span class="block whitespace-nowrap sm:hidden">confirm. req.</span>
          </span>
        </div>
        <SvgoChevronDown class="hidden w-5 shrink-0 text-gray-400 group-open:rotate-180 sm:block" />
      </div>
    </summary>
    <MultisigSafeItems v-if="multisigSafe" :multisig-safe="multisigSafe" :addresses="item.addresses" :chain-id="item.chainId" />
    <div class="flex flex-col gap-4 px-[18px] py-5 sm:px-7.5 sm:py-6.5">
      <h2 class="text-xs font-medium text-gray-400">
        Any transaction requires the confirmation of:
      </h2>

      <div v-if="!actualThreshold" class="loading-box h-5 w-36 rounded-5" />

      <span v-else class="flex items-center gap-2.5 text-xs sm:text-sm">
        <SvgoUserCircle class="text-gray-400" />
        <span>
          {{ actualThreshold }} out of {{ item.addresses.length }}
        </span>
        <button :disabled="isSafeDoesNotMatch || !isAccountCanSign(item.chainId, account, selectedSafe?.owner_address)" class="ml-4 text-xs text-primary disabled:text-gray-400" @click="handleTresholdChange(item.chainId)">
          Change
        </button>
      </span>

      <p v-if="!isAccountCanSign(item.chainId, account, selectedSafe?.owner_address)" class="flex items-center gap-2 text-xs font-medium text-orange">
        <SvgoInfo2 />
        You are not a signer on this chain.
      </p>
    </div>
  </details>
</template>
