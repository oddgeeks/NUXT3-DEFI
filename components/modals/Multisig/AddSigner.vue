<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useFieldArray, useForm } from 'vee-validate'

const props = defineProps<{
  addresses?: ISignerAddress[]
  defaultThreshold?: number
  gnosisAddress?: string
  defaultSelectedNetworks?: number[]
}>()

const emit = defineEmits(['destroy'])

const { account } = useWeb3()
const { getRpcProviderByChainId } = useShared()
const contactSelections = ref<number[]>([])
const resolvedAddresses = ref<Record<string, string>>({})

const steps = useState<SignerSteps>('signer-steps')

const isGnosisMigration = computed(() => !!props.gnosisAddress)

const provider = getRpcProviderByChainId(1)

const {
  handleSubmit,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    addresses: yup
      .array(yup.object({
        name: yup.string(),
        address: yup.string()
          .required('')
          .test('is-valid-address', 'Incorrect address', async (value) => {
            if (!value || isAddress(value || ''))
              return true

            const resolvedAddress = await provider.resolveName(value)

            if (!resolvedAddress)
              return false

            resolvedAddresses.value[value] = resolvedAddress
            return true
          })
          .test(
            'cannot-add-self',
            'Cannot add self as signer',
            async (value) => {
              const resolvedAddress = await provider.resolveName(value || '')

              if (!resolvedAddress || !isAddress(value || ''))
                return true

              return account.value?.toLowerCase() !== (resolvedAddress ? resolvedAddress.toLowerCase() : value?.toLowerCase())
            },
          )
          .test(
            'duplicate-address',
            'Signer already added',
            (value) => {
              if (!isAddress(value || ''))
                return true

              const fieldCount = fields.value.filter(field => field.value.address.toLowerCase() === value?.toLowerCase())

              if (fieldCount?.length > 1)
                return false

              return true
            },
          ),

      })),

  }),
  initialValues: {
    addresses: props.addresses || [{ address: '', name: '' }],
  },
})

const { fields, push, update, remove } = useFieldArray<ISignerAddress>('addresses')

const disabled = computed(() => !meta.value.valid)

function getErrorMessage(errors: any, errorKey: string) {
  return errors ? errors[errorKey] : null
}

const onSubmit = handleSubmit(async () => {
  steps.value.currentStep += 1
  const addresses = fields.value.map(field => field.value)

  openReviewSignerModal({
    addresses: addresses.map(item => isAddress(item.address)
      ? item
      : {
          ...item,
          ensName: item.address,
          address: resolvedAddresses.value[item.address],
        }),
    gnosisAddress: props.gnosisAddress,
    defaultSelectedNetworks: props.defaultSelectedNetworks,
    defaultThreshold: props.defaultThreshold,
  })
  emit('destroy')
})

function handleUpdateField(key: number) {
  update(key, {
    address: '',
    name: '',
  })

  contactSelections.value = contactSelections.value.filter(selection => selection !== key)
}

async function handleSelectContact(key: number) {
  const result = await openSelectContactModal()

  if (result.success) {
    const _contact = result.payload as IContact

    update(key, {
      address: _contact.address,
      name: _contact.name,
    })

    contactSelections.value.push(key)
  }
}

function handleBackClick() {
  steps.value.currentStep -= 1
  emit('destroy')

  if (isGnosisMigration.value)
    openFetchGnosisSafeModal(props.gnosisAddress)
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <Steps class="mr-10" :total-steps="steps?.totalSteps || 4" :current-step="steps?.currentStep || 1" />
      <div class="flex gap-[14px]">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white">
          {{ steps?.currentStep || 1 }}
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Add New Signer(s)
          </h1>
          <h2 class="text-xs font-medium leading-5 text-gray-400">
            Signers can approve/reject transaction. Signers are automatically saved as contacts.
          </h2>
        </div>
      </div>
    </div>

    <hr class="border-gray-800">
    <div class="flex flex-col gap-7.5 p-5 sm:gap-5 sm:p-7.5">
      <fieldset
        v-for="field, key in fields"
        :key="key"
        class="flex flex-col gap-5 sm:flex-row"
      >
        <div class="flex flex-1 flex-col gap-2">
          <div class="flex w-full items-center justify-between">
            <span class="text-xs font-medium leading-5 text-gray-400">
              <span class="inline sm:hidden">{{ key + 1 }}</span> Signer Name
            </span>
          </div>
          <CommonInput
            v-model="field.value.name"
            :disabled="contactSelections.includes(key as number)"
            autofocus
            :name="`addresses[${key}].name`"
            placeholder="Signer Name (Optional)"
            input-classes="placeholder:text-xs"
            :error-message="getErrorMessage(errors, `addresses[${key}].name`)"
          />
        </div>
        <div class="flex flex-1 basis-12 flex-col gap-2">
          <div class="flex w-full items-center justify-between">
            <span class="flex items-center gap-2.5 text-xs font-medium leading-5 text-gray-400">
              <span class="inline sm:hidden">{{ key + 1 }}</span> Signer EOA Address
              <SvgoInfo2 v-if="!isGnosisMigration" v-tippy="'Please make sure you enter the EOA address and not Avocado address.'" class="text-orange" />
            </span>
            <button
              v-if="fields.length > 1" class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900"
              @click="remove(key as number)"
            >
              <SvgoX class="h-3 w-3" />
            </button>
          </div>
          <CommonInput
            :model-value="field.value.ensName || field.value.address"
            :name="`addresses[${key}].address`"
            :disabled="contactSelections.includes(key) || isGnosisMigration"
            :error-message="getErrorMessage(errors, `addresses[${key}].address`)"
            placeholder="Enter Address"
            @update:model-value="v => {
              field.value.ensName = ''
              field.value.address = v
            }"
          >
            <template #suffix>
              <button
                v-if="contactSelections.includes(key)"
                v-tippy="'Clear Contact'"
                type="button"
                class="ml-3" @click="handleUpdateField(key)"
              >
                <SvgoBack class="text-gray-400" />
              </button>
              <button
                v-else-if="!isGnosisMigration"
                v-tippy="'Select contact'"
                type="button"
                class="ml-3"
                @click="handleSelectContact(key)"
              >
                <SvgoContact class="text-gray-400" />
              </button>
            </template>
          </CommonInput>
        </div>
      </fieldset>
      <button v-if="!isGnosisMigration" class="flex items-center gap-3 text-xs text-primary disabled:text-gray-500" :disabled="!meta.valid" @click="push({ address: '', name: '' })">
        <div :class="!meta.valid ? 'bg-gray-500' : ''" class="flex h-4 w-4 rounded-full bg-primary">
          <SvgoPlus class="m-auto h-2 w-2 text-white" />
        </div>
        Add more signer(s)
      </button>
      <div class="flex items-center gap-3">
        <SvgoInfo2 class="h-5 w-5 rounded-full text-gray-500" />
        <p class="text-xs">
          Adding signers requires gas. Exact gas requirement will be visible in the next steps
        </p>
      </div>
    </div>
    <hr class="border-gray-800">
    <div class="grid grid-cols-2 gap-4 p-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBackClick">
        Back
      </CommonButton>
      <CommonButton type="submit" :disabled="disabled" class="justify-center" size="lg">
        Next
      </CommonButton>
    </div>
  </form>
</template>
