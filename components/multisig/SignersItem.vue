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
  if (!selectedSafe.value)
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
      showPendingTransactionModal(txHash, chainId)
    }
  }
}
</script>

<template>
  <details class="rounded-[25px] group text-sm dark:bg-gray-850 bg-slate-50">
    <summary class="flex justify-between flex-wrap sm:gap-0 gap-4.5 p-[18px] sm:py-6.5 sm:px-7.5 cursor-pointer group-open:border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 items-center">
      <h2 class="flex items-center gap-3 sm:w-auto w-full">
        <ChainLogo class="w-7.5 h-7.5" :chain="item.chainId" />
        {{ chainIdToName(item.chainId) }}
        <SvgoChevronDown class="w-5 shrink-0 sm:hidden block ml-auto text-slate-400 group-open:rotate-180" />
      </h2>
      <div class="flex flex-wrap flex-1 justify-between sm:gap-[142px] items-center">
        <div class="flex items-center sm:gap-[100px] gap-5 flex-1 justify-end text-sm text-slate-400 font-medium">
          <div v-if="!actualThreshold" class="loading-box rounded-5 w-36 h-5" />
          <span v-else class="flex items-center gap-2.5">
            <SvgoUsers class="shrink-0" />
            {{ item.addresses.length }}
            <span class="sm:block hidden">total signers</span>
            <span class="sm:hidden block whitespace-nowrap">total sign.</span>
          </span>
          <div v-if="!actualThreshold" class="loading-box rounded-5 w-36 h-5" />
          <span v-else class="flex items-center gap-2.5">
            <SvgoStamp />
            {{ actualThreshold }}
            <span class="sm:block hidden">confirmations required</span>
            <span class="sm:hidden block whitespace-nowrap">confirm. req.</span>
          </span>
        </div>
        <SvgoChevronDown class="w-5 hidden sm:block shrink-0 text-slate-400 group-open:rotate-180" />
      </div>
    </summary>
    <MultisigSafeItems v-if="multisigSafe" :multisig-safe="multisigSafe" :addresses="item.addresses" :chain-id="item.chainId" />
    <div class="flex flex-col gap-4 px-[18px] py-5 sm:py-6.5 sm:px-7.5">
      <h2 class="text-xs font-medium text-slate-400">
        Any transaction requires the confirmation of:
      </h2>

      <div v-if="!actualThreshold" class="loading-box rounded-5 w-36 h-5" />

      <span v-else class="flex items-center gap-2.5 sm:text-sm text-xs">
        <SvgoUserCircle class="text-slate-400" />
        <span>
          {{ actualThreshold }} out of {{ item.addresses.length }}
        </span>
        <button :disabled="isSafeDoesNotMatch || !isAccountCanSign(item.chainId, account, selectedSafe?.owner_address)" class="text-primary disabled:text-slate-400 ml-4 text-xs" @click="handleTresholdChange(item.chainId)">
          Change
        </button>
      </span>

      <p v-if="!isAccountCanSign(item.chainId, account, selectedSafe?.owner_address)" class="text-orange font-medium gap-2 text-xs flex items-center">
        <SvgoInfo2 />
        You are not a signer on this chain.
      </p>
    </div>
  </details>
</template>
