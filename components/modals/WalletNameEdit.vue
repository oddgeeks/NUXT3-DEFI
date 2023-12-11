<script setup lang="ts">
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'

const props = defineProps<{
  safe: ISafe
}>()

const emit = defineEmits(['destroy'])
const walletName = useLocalStorage(`safe-label-${props.safe?.safe_address}`, 'Personal')

const {
  handleSubmit,
  isSubmitting,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    'wallet-name': yup
      .string()
      .required(''),
  }),
})

const { value: name, meta: nameMeta } = useField<string>('wallet-name', {}, { initialValue: walletName.value })
const disabled = computed(() => !meta.value.valid || isSubmitting.value)

const onSubmit = handleSubmit(() => {
  walletName.value = name.value
})

watch([walletName], () => {
  emit('destroy')
})
</script>

<template>
  <form class="flex flex-col gap-[30px]" @submit="onSubmit">
    <div class="flex flex-col gap-[12px]">
      <p class="text-center text-[18px] font-semibold leading-[20px]">
        Edit Wallet Note
      </p>
      <p class="text-[12px] font-medium leading-[20px] text-gray-400">
        This is stored locally, and is visible only to you
      </p>
    </div>
    <CommonInput
      v-model="name"
      :error-message="nameMeta.dirty ? errors['wallet-name'] : ''"
      name="wallet-name"
      autofocus
      type="search"
      required
      placeholder="Wallet Note"
    />
    <CommonButton :disabled="disabled" type="submit" class="flex items-center justify-center">
      Save Changes
    </CommonButton>
  </form>
</template>
