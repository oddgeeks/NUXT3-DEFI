<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'

const safes = ref<string[]>([])

const {
  handleSubmit,
  errors,
  meta,
  validate,

} = useForm({
  validationSchema: yup.object({
    gnosisAddress: yup.string()
      .required('')
      .test('is-valid-address', 'Incorrect address', (value) => {
        return value ? isAddress(value || '') : true
      }),

  }),
})

const { value: gnosisAddress } = useField<string>('gnosisAddress')

const { value: chainId } = useField<string>(
  'chainId',
  undefined, {
    initialValue: '137',
  },
)

watch(errors, async () => {
  if (meta.value.valid)
    console.log('selam')
}, {
  deep: true,
})
</script>

<template>
  <div>
    <div class="p-7.5 flex items-center gap-[14px]">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        1
      </div>
      {{ errors }}
      <h1 class="text-lg">
        Enter the Gnosis safe wallet details
      </h1>
    </div>
    <div class="p-7.5 flex gap-5">
      <CommonInput v-model="gnosisAddress" name="gnosisAddress" placeholder="Wallet Address" class="flex-1" />
      <CommonSelect
        v-model="chainId"
        name="chainId"
        class="flex-1"
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
    <div class="p-7.5">
      <CommonButton class="w-full justify-center" size="lg">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
