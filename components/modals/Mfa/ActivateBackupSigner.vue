<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'
import { useField, useForm } from 'vee-validate'

const { handleSubmit } = useForm()

function validateAddress(value: string) {
  return value ? isAddress(value as string || '') : true
}

const { value: address } = useField('address', validateAddress)
const { value: confirmAddress } = useField('confirm-address', validateAddress)

const onSubmit = handleSubmit(async (values) => {
  console.log(values)
})
</script>

<template>
  <div class="p-7.5">
    <h1 class="mb-7.5 text-lg leading-[30px]">
      Add backup signer
    </h1>

    <form class="flex flex-col gap-5" @submit="onSubmit">
      <div class="flex flex-col gap-2.5">
        <label for="input-address" class="text-sm font-medium leading-5">Enter address</label>
        <CommonInput v-model="address" autofocus name="address" />
      </div>
      <div class="flex flex-col gap-2.5">
        <label for="input-confirm-address" class="text-sm font-medium leading-5">Confirm address</label>
        <CommonInput v-model="confirmAddress" name="confirm-address" />
      </div>
    </form>
  </div>
</template>
