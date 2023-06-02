<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import AvatarSVG from '~/assets/images/icons/avatar.svg?component'
import ContactSVG from '~/assets/images/icons/contact.svg?component'

const emit = defineEmits(['destroy'])

const { addAuthority } = useAuthorities()
const { authorities } = storeToRefs(useAuthorities())

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
  setValue,
} = useField<string>('address')

const disabled = computed(() => !meta.value.valid || isSubmitting.value)

const onSubmit = handleSubmit(() => {
  addAuthority(address.value)

  emit('destroy')
})

async function handleSelectContact() {
  const result = await openSelectContactModal()

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
      <div>
        <CommonInput
          v-model="address"
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
        type="submit"
        size="lg"
        :disabled="disabled"
        class="w-full items-center justify-center"
      >
        Add
      </CommonButton>
    </div>
  </form>
</template>
