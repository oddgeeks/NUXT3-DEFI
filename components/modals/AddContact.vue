<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import ClipboardSVG from '~/assets/images/icons/clipboard.svg?component'

const props = defineProps<{
  name?: string
  address?: string
  chainId?: string
  isEdit: Boolean
}>()

const emit = defineEmits(['resolve', 'reject'])

const { contacts, addContact, editContact } = useContacts()
const { account } = useWeb3()

const networks = [
  {
    name: 'All Networks',
    chainId: '',
  },
  ...availableNetworks,
] as Network[]

const {
  handleSubmit,
  isSubmitting,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    contactName: yup.string().required(''),
    chainId: yup.string(),
    address: yup
      .string()
      .required('')
      .test('is-valid-address', 'Incorrect address', (value) => {
        return value ? isAddress(value || '') : true
      })
      .test(
        'duplicate-address',
        'Contact already added',
        (value, { parent }) => {
          if (
            props.isEdit
            && value?.toLowerCase() === props.address?.toLowerCase()
            && parent.chainId == props.chainId
          )
            return true
          if (!isAddress(value || ''))
            return true
          if (!contacts.value)
            return true

          if (value?.toLocaleLowerCase() === account.value?.toLowerCase())
            return false

          return !contacts.value.some(
            (contact) => {
              const isAddressMatch = contact.address.toLowerCase() === value?.toLowerCase()

              if (!isAddressMatch)
                return false

              if (contact.chainId === '' || parent.chainId === '')
                return true

              return contact.chainId == parent.chainId
            },
          )
        },
      ),
  }),
})

const { value: chainId } = useField<string>(
  'chainId',
  undefined,
  {
    initialValue: props.chainId ?? '',
  },
)
const { value: contactName, setValue: setContactName }
  = useField<string>('contactName')
// eslint-disable-next-line vue/no-dupe-keys
const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
} = useField<string>('address')

const disabled = computed(() => !meta.value.valid || isSubmitting.value)

const onSubmit = handleSubmit(() => {
  const _contact = {
    name: contactName.value,
    chainId: chainId.value,
    address: address.value,
  }
  if (props.isEdit) {
    editContact(
      {
        name: props.name!,
        address: props.address!,
        chainId: props.chainId!,
      },
      _contact,
    )
  }
  else {
    addContact(_contact)
  }

  emit('resolve', true, _contact)
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

onMounted(() => {
  if (props.name)
    setContactName(props.name)

  if (props.address)
    setAddress(props.address)
})
</script>

<template>
  <form @submit="onSubmit">
    <h1 class="mb-7.5 text-center text-lg leading-5">
      {{ props.isEdit ? "Edit" : "Create" }} Contact
    </h1>
    <div class="mb-7.5 flex flex-col gap-5">
      <div>
        <p class="mb-2.5 text-sm">
          Name
        </p>
        <CommonInput
          v-model="contactName"
          autofocus
          name="contactName"
          placeholder="Enter Name"
        />
      </div>
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
      <div>
        <p class="mb-2.5 text-sm">
          Network
        </p>
        <CommonSelect
          v-model="chainId"
          class="w-full"
          value-key="chainId"
          label-key="name"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="h-6 w-6 shrink-0" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="h-6 w-6 shrink-0" :chain="value" />
          </template>
        </CommonSelect>
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
