<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import { AvoSafeImplementation__factory } from '~~/contracts'
import AvatarSVG from '~/assets/images/icons/avatar.svg?component'
import ContactSVG from '~/assets/images/icons/contact.svg?component'

const emit = defineEmits(['destroy'])

const { authorities } = storeToRefs(useAuthorities())
const { safeAddress, signer, sendTransaction } = useAvocadoSafe()

const chainId = ref('1')

const {
  handleSubmit,
  isSubmitting,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    address: yup
      .string()
      .required('')
      .test('is-valid-address', 'Incorrect address', (value) => {
        return value ? isAddress(value || '') : true
      })
      .test(
        'duplicate-address',
        'Authority already added',
        (value) => {
          if (!isAddress(value || ''))
            return true
          return !authorities.value.some(
            authority =>
              authority.address?.toLowerCase() === value?.toLowerCase(),
          )
        },
      ),
  }),
})

const {
  value: address,
  meta: addressMeta,
  setValue,
} = useField<string>('address')

const { data: tx } = useAsyncData(async () => {
  if (!address.value || !safeAddress.value)
    return

  const instance = AvoSafeImplementation__factory.connect(safeAddress.value, signer.value!)
  const resp = await instance.populateTransaction.addAuthorities([address.value])

  return {
    to: safeAddress.value,
    data: resp.data,
    value: '0',
    operation: '0',
    chainId: chainId.value,
  }
}, {
  watch: [
    address,
    safeAddress,
    chainId,
  ],
})

const { data, pending, error } = useEstimatedFee(
  tx,
  chainId,
)

const disabled = computed(() => !meta.value.valid || isSubmitting.value || !!error.value || pending.value)

const onSubmit = handleSubmit(async () => {
  if (!tx.value)
    return

  const txHash = await sendTransaction(tx.value)

  if (!txHash)
    return

  emit('destroy')

  showPendingTransactionModal(txHash, chainId.value, 'send')
})

async function handleSelectContact() {
  const result = await openSelectContactModal(chainId.value)

  if (result.success) {
    const _contact = result.payload as IContact

    setValue(_contact.address)
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex items-center justify-center gap-7.5 flex-col">
      <AvatarSVG class="text-primary w-10 h-10" />
      <h1 class="text-lg text-center leading-5 mb-7.5">
        Add New Authority
      </h1>
    </div>
    <div class="flex flex-col gap-5 mb-7.5">
      <div class="flex flex-col gap-2.5">
        <span class="text-sm">Address</span>
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
              }"
              type="button"
              class="ml-3"
              @click="handleSelectContact()"
            >
              <ContactSVG />
            </button>
          </template>
        </CommonInput>
      </div>
      <div class="flex flex-col gap-2.5">
        <span class="text-sm">Network</span>
        <CommonSelect
          v-model="chainId"
          value-key="chainId"
          label-key="name"
          :options="availableNetworks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>
    </div>
    <div class="flex gap-4">
      <CommonButton
        color="white"
        size="lg"
        class="w-full items-center justify-center"
        @click="$emit('destroy')"
      >
        Cancel
      </CommonButton>
      <CommonButton
        :loading="isSubmitting"
        type="submit"
        size="lg"
        :disabled="disabled"
        class="w-full items-center justify-center"
      >
        Add
      </CommonButton>
    </div>
    <EstimatedFee class="mt-7.5" :data="data" :loading="pending" :error="error" />
  </form>
</template>
