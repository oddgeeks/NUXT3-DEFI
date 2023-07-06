<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useFieldArray, useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  addresses?: string[]
  defaultTreshold?: number
}>()

const emit = defineEmits(['destroy'])

const { signers } = storeToRefs(useMultisig())
const { account } = useWeb3()

const {
  handleSubmit,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    addresses: yup
      .array(yup.string()
        .required('')
        .test('is-valid-address', 'Incorrect address', (value) => {
          return value ? isAddress(value || '') : true
        })
        .test(
          'duplicate-address',
          'Signer already added',
          (value) => {
            if (!isAddress(value || ''))
              return true

            const fieldCount = fields.value.filter(field => field.value.toLowerCase() === value?.toLowerCase())

            if (fieldCount?.length > 1)
              return false

            return !signers.value.some(
              signer =>
                signer.address?.toLowerCase() === value?.toLowerCase(),
            ) && fields.value.some(field => field.value.toLowerCase() === value?.toLowerCase())
          },
        )
        .test(
          'cannot-add-self',
          'Cannot add self as signer',
          (value) => {
            if (!isAddress(value || ''))
              return true
            return account.value?.toLowerCase() !== value?.toLowerCase()
          },
        )),

  }),
  initialValues: {
    addresses: props.addresses || [''],
  },
})

const { fields, push, update, remove } = useFieldArray<string>('addresses')

const disabled = computed(() => !meta.value.valid)

function getErrorMessage(errors: any, key: number | string) {
  const errorKey = `addresses[${key}]`
  return errors ? errors[errorKey] : null
}

const onSubmit = handleSubmit(async () => {
  const addresses = fields.value.map(field => field.value)

  openReviewSignerModal(addresses)
  emit('destroy')
})

async function handleSelectContact(key: number) {
  const result = await openSelectContactModal('0')

  if (result.success) {
    const _contact = result.payload as IContact

    update(key, _contact.address)
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        1
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Add New Signers
        </h1>
        <h2 class="text-xs leading-5 text-slate-400 font-medium">
          Signers can approve/reject transaction. Signers are automatically saved as contacts.
        </h2>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5 flex flex-col gap-5">
      <div
        v-for="field, key in fields"
        :key="key"
        class="flex flex-col gap-2"
      >
        <div class="flex justify-between items-center w-full">
          <span class="text-xs font-medium leading-5 text-slate-400">
            Signer address
          </span>
          <button
            v-if="key !== 0" class="h-5 w-5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
            @click="remove(key as number)"
          >
            <SvgoX class="w-3 h-3" />
          </button>
        </div>
        <CommonInput
          v-model="field.value"
          autofocus
          name="addresses"
          placeholder="Enter Address"
          :error-message="getErrorMessage(errors, key)"
        >
          <template #suffix>
            <button
              v-tippy="{
                content: 'Select contact',
              }"
              type="button"
              class="ml-3"
              @click="handleSelectContact(field.key as number)"
            >
              <SvgoContact />
            </button>
          </template>
        </CommonInput>
      </div>
      <button class="flex items-center text-primary gap-3 text-xs" @click="push('')">
        <div class="bg-primary w-4 h-4 rounded-full flex">
          <SvgoPlus class="text-white m-auto w-2 h-2" />
        </div>
        Add New Siger
      </button>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="$emit('destroy')">
        Back
      </CommonButton>
      <CommonButton type="submit" :disabled="disabled" class="justify-center" size="lg">
        Next
      </CommonButton>
    </div>
  </form>
</template>
