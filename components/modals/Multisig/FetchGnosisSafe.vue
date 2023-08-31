<script setup lang="ts">
import { getAddress, isAddress } from 'ethers/lib/utils'
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { GnosisSafe__factory } from '@/contracts'

const props = defineProps<{
  address?: string
}>()

const emit = defineEmits(['destroy'])
const { getContactNameByAddress } = useContacts()
const { signers } = storeToRefs(useMultisig())
const owners = ref<string[]>([])
const defaultThreshold = ref(0)

const pending = ref(false)
const steps = useState<SignerSteps>('signer-steps')
const { account } = useWeb3()

const gnosisNetworkMapping: Record<string, string> = {
  'eth': '1',
  'gno': '100',
  'matic': '137',
  'bnb': '56',
  'arb1': '42161',
  'aurora': '1313161554',
  'base': '8453',
  'avax': '43114',
  'celo': '42220',
  'oeth': '10',
  'base-gor': '84531',
  'gor': '5',
}

function parseAddress(addrr: string) {
  const hasColon = addrr ? addrr.includes(':') : false
  const defaultResult = { chainId: null, address: addrr, valid: true }

  if (hasColon) {
    const [mapping, address] = addrr.split(/:(.+)/)
    const gnosisChain = gnosisNetworkMapping[mapping]

    const valid = availableNetworks.some(i => String(i.chainId) == String(gnosisChain))

    return {
      chainId: valid ? gnosisChain : null,
      address,
      valid,
    }
  }

  return defaultResult
}

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
      .test('is-valid-address', 'Incorrect safe address', async (value, { createError }) => {
        owners.value = []

        if (!value)
          return true

        const parsedValue = parseAddress(value)

        if (!parsedValue.valid)
          return false

        if (parsedValue?.chainId)
          setState({ value: parsedValue.chainId, touched: false })

        if (!isAddress(parsedValue.address))
          return false

        try {
          pending.value = true

          const contract = GnosisSafe__factory.connect(parsedValue.address, getRpcProvider(chainId.value))

          const addresses = await contract.getOwners()
          const threshold = await contract.getThreshold()

          defaultThreshold.value = threshold.toNumber()

          const isOwner = addresses.some(i => getAddress(i) === getAddress(account.value))

          if (!isOwner) {
            return createError({
              message: 'You are not a signer of this safe',
              path: 'gnosisAddress',
            })
          }

          const filteredAddresses = addresses.filter(i =>
            !signers.value.some(s => getAddress(s.address) === getAddress(i)
            || getAddress(i) === getAddress(account.value),
            ),
          )

          console.log({
            addresses,
            threshold,
            filteredAddresses,
            signers: signers.value,
          })

          owners.value = filteredAddresses

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

const { value: chainId, setState } = useField<string>(
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
    gnosisAddress: parseAddress(gnosisAddress.value).address,
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
      <CommonInput v-model="gnosisAddress" autofocus :error-message="errorMessage" name="gnosisAddress" placeholder="Gnosis safe address" />
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
