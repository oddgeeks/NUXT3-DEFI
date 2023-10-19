<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

const emits = defineEmits(['destroy'])

const { account } = useWeb3()
const { handleSubmit, meta } = useForm({
  validationSchema: yup.object({
    address: yup.string().required('')
      .test('is-address', 'Invalid address', validateAddress)
      .test('is-not-own-address', 'Owner can not be added as a backup address', (value) => {
        try {
          if (!value)
            return true

          return !isAddressEqual(value, account.value)
        }
        catch (error) {
          return false
        }
      }),
    confirm: yup.boolean().required().equals([true]),
  }),
})

function validateAddress(value: any) {
  try {
    return isAddress(value)
  }
  catch (error) {
    return false
  }
}

const { value: address, errorMessage } = useField<string>('address')
const { value: confirm } = useField<boolean>('confirm')
const { value: confirm2 } = useField<boolean>('confirm-2')

const onSubmit = handleSubmit(async () => {
  emits('destroy')
  openMfaSignInstadappSignerModal(address.value)
})
</script>

<template>
  <div class="p-7.5">
    <h1 class="mb-7.5 text-lg leading-[30px]">
      Add backup signer
    </h1>

    <form class="flex flex-col gap-5" @submit="onSubmit">
      <div class="flex flex-col gap-2.5">
        <label for="input-address" class="text-sm font-medium leading-5">Enter EOA address</label>
        <CommonInput v-model="address" :error-message="errorMessage" placeholder="Signer address" autofocus name="address" />
      </div>

      <div class="flex flex-col gap-2.5">
        <label class="mt-2.5 flex cursor-pointer gap-2.5 text-xs" for="input-confirm">
          <input id="input-confirm" v-model="confirm" name="confirm" class="peer sr-only" type="checkbox">
          <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-0.5 h-5 w-5 shrink-0 cursor-pointer text-slate-400" />
          <span :class="!confirm ? 'text-slate-500' : ''">
            I confirm that I want to add the above address as my backup signer.
          </span>
        </label>
        <label class="mt-2.5 flex cursor-pointer gap-2.5 text-xs" for="input-confirm-2">
          <input id="input-confirm-2" v-model="confirm2" name="confirm-2" class="peer sr-only" type="checkbox">
          <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-0.5 h-5 w-5 shrink-0 cursor-pointer text-slate-400" />
          <span :class="!confirm2 ? 'text-slate-500' : ''">
            I confirm that this address is an EOA address and not an Avocado address.
          </span>
        </label>
      </div>
      <div class="flex gap-4">
        <CommonButton class="flex-1 justify-center" color="white" size="lg">
          Close
        </CommonButton>
        <CommonButton type="submit" :disabled="!meta.valid" class="flex-1 justify-center" size="lg">
          Confirm
        </CommonButton>
      </div>
    </form>
  </div>
</template>
