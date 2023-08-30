<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { GnosisSafe__factory } from '~~/contracts'

const props = defineProps<{
  address?: string
}>()

const emit = defineEmits(['destroy'])
const { getContactNameByAddress } = useContacts()
const owners = ref<string[]>([])

const pending = ref(false)
const steps = useState<SignerSteps>('signer-steps')

const transformedOwners = computed<ISignerAddress[]>(() => {
  return owners.value.map((i) => {
    return {
      address: i,
      name: getContactNameByAddress(i),
    }
  })
})

const {
  meta,
  handleSubmit,
} = useForm({
  validationSchema: yup.object({
    gnosisAddress: yup.string()
      .required('')
      .test('is-valid-address', 'Incorrect safe address', async (value) => {
        owners.value = []

        if (!value)
          return true

        if (!isAddress(value))
          return false

        try {
          pending.value = true
          const contract = GnosisSafe__factory.connect(gnosisAddress.value, getRpcProvider(chainId.value))

          const addresses = await contract.getOwners()

          owners.value = addresses

          return true
        }
        catch (e) {
          console.log(e)
          return false
        }
        finally {
          pending.value = false
        }
      }),

  }),
})

const { value: gnosisAddress, errorMessage } = useField<string>('gnosisAddress', undefined, {
  initialValue: props.address,
})

const { value: chainId } = useField<string>(
  'chainId',
  undefined, {
    initialValue: '137',
  },
)

const onSubmit = handleSubmit(() => {
  steps.value.currentStep += 1

  emit('destroy')

  openAddSignerModal({
    addresses: transformedOwners.value,
    gnosisAddress: gnosisAddress.value,
    defaultSelectedNetworks: [Number(chainId.value)],
  })
})
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex flex-col gap-7.5 sm:p-7.5 p-5">
      <div class="flex items-center gap-[14px]">
        <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
          1
        </div>
        <h1 class="text-lg">
          Enter the Gnosis safe wallet details
        </h1>
      </div>
      <Steps :current-step="steps?.currentStep || 1" :total-steps="steps?.totalSteps || 5" />
    </div>
    <div class="px-7.5 flex gap-5">
      <CommonInput v-model="gnosisAddress" autofocus :error-message="errorMessage" name="gnosisAddress" placeholder="Gnosis safe address" class="flex-1" />
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
      <CommonButton :loading="pending" :disabled="!meta.valid || !owners.length" class="w-full justify-center" size="lg" type="submit">
        Continue
      </CommonButton>
    </div>
  </form>
</template>
