<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

const emit = defineEmits(['resolve'])

const {
  handleSubmit,
  meta,
} = useForm({
  validationSchema: yup.object({
    nonce: yup.string()
      .test('is-number', 'Nonce must be a number', (value) => {
        return value ? !toBN(value || '').isNaN() : true
      }),
  }),

})

const { value: nonce, errorMessage: nonceErrorMessage } = useField<string>('nonce')
const { value: note, errorMessage: noteErrorMessage } = useField<string>('note')

const onSubmit = handleSubmit(() => {
  emit('resolve', true, {
    nonce: nonce.value,
    note: note.value,
  })
})
</script>

<template>
  <form class="flex flex-col gap-4" @submit="onSubmit">
    <div>
      <span class="text-xs">Nonce</span>
      <CommonInput v-model="nonce" name="nonce" :error-message="nonceErrorMessage" autofocus />
    </div>
    <div>
      <span class="text-xs">Note</span>
      <CommonInput v-model="note" name="note" :error-message="noteErrorMessage" />
    </div>

    <CommonButton :disabled="!meta.valid" class="justify-center" size="lg" type="submit">
      Submit
    </CommonButton>
  </form>
</template>
