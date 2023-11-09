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
  setValue,
} = useField<string>('address')

async function handleSelectContact() {
  const result = await openSelectContactModal(props.asset.chainId)

  if (result.success) {
    const _contact = result.payload as IContact

    setValue(_contact.address)
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
      undefined,
      'nft',
    )

    if (!transactionHash)
      return

    emit('destroy')

    showPendingTransactionModal({
      hash: transactionHash,
      chainId: props.asset.chainId,
      type: 'nft',
    })

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
  <form class="flex flex-col gap-7.5" @submit.prevent="onSubmit">
    <h1 class="text-center text-lg leading-5">
      Send
    </h1>
    <div class="flex max-w-full items-center justify-between gap-3 rounded-5 bg-slate-50 px-5 py-4 dark:bg-gray-850">
      <img v-if="asset.imageUrl" :alt="asset.collectionName" width="40" height="40" class="h-10 w-10 shrink-0 rounded-full" :src="asset.imageUrl">
      <BrokenSVG v-else class="h-8 w-8" />
      <div class="flex max-w-[60%] flex-1 flex-col gap-[2px]">
        <div class="flex items-center">
          <h1 v-tippy="asset.collectionName" class="text-shadow inline-flex overflow-hidden whitespace-nowrap pr-4  text-lg leading-6">
            {{ asset.collectionName }}
          </h1>
          <NuxtLink external target="_blank" class="shrink-0" :to="getExplorerUrl(asset.chainId, `/address/${asset.contractAddress}`)">
            <ExternalLinkSVG class="w-4 shrink-0" />
          </NuxtLink>
        </div>
        <h2 class="text-xs font-medium text-gray-400">
          {{ asset.name }}
        </h2>
      </div>
      <div class="flex h-10 items-center justify-center gap-2 rounded-5 bg-slate-150 px-3 text-xs dark:bg-gray-900">
        <ChainLogo :chain="asset.chainId" class="h-5.5 w-5.5" />
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
            <ContactSVG class="text-gray-400" />
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
    <CommonButton :loading="isSubmitting || pending" :disabled="sendingDisabled" type="submit" class="w-full justify-center" size="lg">
      Send NFT
    </CommonButton>
  </form>
</template>
