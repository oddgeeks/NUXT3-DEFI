<script setup lang="ts">
import * as yup from 'yup'
import { ethers } from 'ethers'
import { useField, useForm } from 'vee-validate'
import { isAddress } from '@ethersproject/address'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'
import BrokenSVG from '~/assets/images/icons/broken.svg?component'
import ContactSVG from '~/assets/images/icons/contact.svg?component'

const props = defineProps<{
  asset: NFTData
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, sendTransactions } = useAvocadoSafe()
const { account } = useWeb3()
const { parseTransactionError } = useErrorHandler()
const { getRpcProviderByChainId } = useShared()

const actualAddress = ref('')

const addressIsDsa = computedAsync(async () => {
  if (!actualAddress.value)
    return false

  try {
    const isDSA = await checkAddressIsDsa(actualAddress.value, props.asset.chainId, getRpcProviderByChainId(props.asset.chainId))

    return isDSA
  }
  catch (e) {
    console.log(e)
    return false
  }
})

const sendingDisabled = computed(
  () =>
    isSubmitting.value
    || pending.value
    || !meta.value.valid
    || !!error.value,
)

const { handleSubmit, errors, meta, validate, isSubmitting }
  = useForm({
    validationSchema: yup.object({
      address: yup
        .string()
        .required('')
        .test('is-address', 'Incorrect address', async (value) => {
          triggerRef(addressIsDsa)
          if (!value)
            return true

          const resolvedAddress
            = value.endsWith('.eth') && props.asset.chainId == 1
              ? await getRpcProviderByChainId(1).resolveName(value)
              : null

          if (resolvedAddress) {
            actualAddress.value = resolvedAddress
            return true
          }

          if (isAddress(value)) {
            actualAddress.value = value
            return true
          }

          actualAddress.value = ''

          return false
        }),
    }),

  })

const {
  value: address,
  meta: addressMeta,
  setState: setAddress,
} = useField<string>('address')

async function handleSelectContact() {
  const result = await openSelectContactModal()

  if (result.success) {
    const _contact = result.payload as IContact

    setAddress({ value: _contact.address })
  }
}

const { data: txs } = useAsyncData<any>(
  async () => {
    const { valid } = await validate()

    if (!valid)
      return

    const erc712ABI = [
      'function transferFrom(address from, address to, uint256 tokenId)',
    ]

    const contractInterface = new ethers.utils.Interface(erc712ABI)

    console.log('safeAddress.value: ', safeAddress.value, 'actualAddress.value: ', actualAddress.value,
      'props.asset.tokenId: ', props.asset.tokenId)
    const calldata = contractInterface.encodeFunctionData('transferFrom', [safeAddress.value, actualAddress.value, props.asset.tokenId])

    console.log('props.asset.contractAddress: ', props.asset.contractAddress)
    console.log('props.asset: ', props.asset)
    return [
      {
        to: props.asset.contractAddress,
        data: calldata,
        operation: 0,
        value: '0',
      },
    ]
  },
  {
    watch: [actualAddress],
  },
)

const { data, pending, error } = useEstimatedFee(txs, ref(props.asset.chainId))

const onSubmit = handleSubmit(async () => {
  try {
    const transactionHash = await sendTransactions(
      txs.value,
      props.asset.chainId,
    )

    emit('destroy')

    showPendingTransactionModal(transactionHash, props.asset.chainId, 'send')

    const message = `
${'`Collection name`'} ${props.asset.collectionName}
${'`Token name`'} ${props.asset.name || ''}
${'`Token ID`'} ${props.asset.tokenId || ''}
${'`Transfer To`'} ${actualAddress.value}`

    logActionToSlack({
      message,
      action: 'nft',
      txHash: transactionHash,
      chainId: String(props.asset.chainId),
      account: account.value,
    })
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'nft',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
})
</script>

<template>
  <form class="flex gap-7.5 flex-col" @submit.prevent="onSubmit">
    <h1 class="text-lg leading-5 text-center">
      Send
    </h1>
    <div class="flex items-center justify-between gap-3 px-5 py-4 dark:bg-gray-850 bg-slate-50 rounded-5 max-w-full">
      <img v-if="asset.imageUrl" :alt="asset.collectionName" width="40" height="40" class="w-10 h-10 rounded-full shrink-0" :src="asset.imageUrl">
      <BrokenSVG v-else class="w-8 h-8" />
      <div class="flex flex-col gap-[2px] flex-1 max-w-[60%]">
        <div class="flex items-center">
          <h1 v-tippy="asset.collectionName" class="inline-flex text-lg leading-6 overflow-hidden pr-4  whitespace-nowrap text-shadow">
            {{ asset.collectionName }}
          </h1>
          <NuxtLink external target="_blank" class="shrink-0" :to="getExplorerUrl(asset.chainId, `/address/${asset.contractAddress}`)">
            <ExternalLinkSVG class="shrink-0 w-4" />
          </NuxtLink>
        </div>
        <h2 class="text-xs font-medium text-slate-400">
          {{ asset.name }}
        </h2>
      </div>
      <div class="flex items-center justify-center h-10 gap-2 px-3 text-xs dark:bg-slate-800 bg-slate-150 rounded-5">
        <ChainLogo :chain="asset.chainId" class="w-5.5 h-5.5" />
        {{ chainIdToName(asset.chainId) }}
      </div>
    </div>
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <span class="text-sm">Address</span>
        <span
          v-if="addressIsDsa"
          class="flex items-center gap-2 text-sm text-orange-400"
        >
          <SVGInfoCircle v-tippy="'Note that you are sending NFT to a DSA. Instadapp Pro does not support NFT transfers through its user interface, except for Uniswap NFT positions'" />DSA transfer Detected
        </span>
      </div>

      <CommonInput
        v-model="address"
        autofocus
        :error-message="addressMeta.dirty ? errors.address : ''"
        name="address"
        placeholder="Enter Address"
      >
        <template #suffix>
          <button
            v-tippy="{
              content: 'Select contact',
              trigger: 'mouseenter',
            }"
            type="button"
            class="ml-3"
            @click="handleSelectContact()"
          >
            <ContactSVG class="text-slate-400" />
          </button>
        </template>
      </CommonInput>
    </div>
    <EstimatedFee
      :chain-id="asset.chainId"
      :loading="pending"
      :data="data"
      :error="error"
    />
    <CommonButton :loading="isSubmitting || pending" :disabled="sendingDisabled" type="submit" class="justify-center w-full" size="lg">
      Send NFT
    </CommonButton>
  </form>
</template>
