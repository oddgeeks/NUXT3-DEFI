<script setup lang="ts">
import * as yup from 'yup'
import { ethers } from 'ethers'
import { useField, useForm } from 'vee-validate'
import { isAddress } from '@ethersproject/address'
import BrokenSVG from '~/assets/images/icons/broken.svg?component'
import ContactSVG from '~/assets/images/icons/contact.svg?component'

const props = defineProps<{
  asset: NFTData
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, sendTransactions } = useAvocadoSafe()

const actualAddress = ref('')

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
          if (!value)
            return true

          const resolvedAddress
            = value.endsWith('.eth') && props.asset.chainId == 1
              ? await getRpcProvider(1).resolveName(value)
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

    const calldata = contractInterface.encodeFunctionData('transferFrom', [safeAddress.value, actualAddress.value, props.asset.tokenId])

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
  const transactionHash = await sendTransactions(
    txs.value,
    props.asset.chainId,
  )

  emit('destroy')

  showPendingTransactionModal(transactionHash, props.asset.chainId, 'send')
})
</script>

<template>
  <form class="flex gap-7.5 flex-col" @submit.prevent="onSubmit">
    <h1 class="text-center text-lg leading-5">
      Send
    </h1>
    <div class="dark:bg-gray-850 bg-slate-50 px-5 py-4 rounded-5 flex gap-3 justify-between items-center">
      <img v-if="asset.imageUrl" :alt="asset.collectionName" width="40" height="40" class="w-10 h-10 rounded-full shrink-0" :src="asset.imageUrl">
      <BrokenSVG v-else class="w-8 h-8" />
      <div class="flex flex-col gap-[2px] flex-1">
        <h1 v-tippy="asset.collectionName" class="text-lg leading-6  overflow-hidden whitespace-nowrap text-shadow">
          {{ asset.collectionName }}
        </h1>
        <h2 class="text-xs text-slate-400 font-medium">
          {{ asset.name }}
        </h2>
      </div>
      <div class="dark:bg-slate-800 bg-slate-150 rounded-5 px-3 h-10 text-xs flex gap-2 items-center justify-center">
        <ChainLogo :chain="asset.chainId" class="w-5.5 h-5.5" />
        {{ chainIdToName(asset.chainId) }}
      </div>
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
          <ContactSVG />
        </button>
      </template>
    </CommonInput>
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
