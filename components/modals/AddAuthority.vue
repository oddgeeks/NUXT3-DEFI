<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import ClipboardSVG from '~/assets/images/icons/clipboard.svg'

const emit = defineEmits(['destroy'])

const { authorities, addAuthority } = useAuthorities()

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
              authority.toLowerCase() === value?.toLowerCase(),
          )
        },
      ),
  }),
})

const {
  value: address,
  meta: addressMeta,
} = useField<string>('address')

const disabled = computed(() => !meta.value.valid || isSubmitting.value)

const onSubmit = handleSubmit(() => {
  addAuthority(address.value)

  emit('destroy')
})

async function pasteAddress() {
  try {
    address.value = await navigator.clipboard.readText()
  }
  catch (e) {
    console.log(e)
    openSnackbar({
      message: 'Please allow clipboard access',
      type: 'error',
    })
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <h1 class="text-lg text-center leading-5 mb-7.5">
      Add New Owner
    </h1>
    <div class="flex flex-col gap-5 mb-7.5">
      <div>
        <p class="mb-2.5 text-sm">
          Address
        </p>
        <CommonInput
          v-model="address"
          :error-message="addressMeta.dirty ? errors.address : ''"
          name="address"
          placeholder="Enter Address"
        >
          <template #suffix>
            <button type="button" @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>
      </div>
    </div>
    <CommonButton
      type="submit"
      size="lg"
      :disabled="disabled"
      class="w-full items-center justify-center"
    >
      Save
    </CommonButton>
  </form>
</template>
