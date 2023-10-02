<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const props = defineProps<{
  addresses: ISignerAddress[]
  gnosisAddress?: string
  defaultSelectedNetworks?: number[]
  defaultThreshold?: number
}>()

const emit = defineEmits(['destroy'])

const steps = useState<SignerSteps>('signer-steps')

const { selectedSafe } = storeToRefs(useSafe())

function handleBack() {
  steps.value.currentStep -= 1
  emit('destroy')
  openAddSignerModal({
    addresses: props.addresses,
    gnosisAddress: props.gnosisAddress,
    defaultSelectedNetworks: props.defaultSelectedNetworks,
    threshold: props.defaultThreshold,
  })
}

async function handleNext() {
  steps.value.currentStep += 1
  emit('destroy')

  openMultisigSelectNetworkModal({
    addresses: props.addresses,
    gnosisAddress: props.gnosisAddress,
    defaultSelectedNetworks: props.defaultSelectedNetworks,
    defaultThreshold: props.defaultThreshold,
  })
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <Steps class="mr-10" :total-steps="steps?.totalSteps || 4" :current-step="steps?.currentStep || 2" />

      <div class="flex gap-[14px]">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white">
          {{ steps.currentStep }}
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Review Details
          </h1>
          <h2 class="text-xs font-medium leading-5 text-slate-400">
            It might take a few minutes for new signers to be synced
          </h2>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">

    <table style="border-collapse: separate" class="w-full border-spacing-y-5 px-6 sm:border-spacing-y-7.5 sm:px-7.5">
      <tbody class="text-sm font-medium">
        <tr>
          <td class="hidden leading-[30px] text-slate-400 sm:block">
            Multisig Address
          </td>
          <td>
            <span class="mb-2 block text-xs font-medium sm:hidden">Address</span>
            <span class="flex items-center gap-2.5 text-slate-400">
              {{ shortenHash(selectedSafe?.safe_address!) }}
              <Copy icon-only :text="selectedSafe?.safe_address!" />
            </span>
          </td>
        </tr>
        <tr>
          <td class="hidden align-baseline leading-[30px] text-slate-400 sm:block sm:pr-[60px]">
            New signers
          </td>
          <td>
            <span class="mb-2 block align-baseline text-xs leading-[30px] sm:hidden">
              New signers
            </span>
            <ul class="flex flex-col gap-5">
              <li v-for="address in addresses" :key="address.address" class="flex items-center gap-3">
                <AuthorityAvatar :address="address.address" />

                <span v-if="address.name">
                  ({{ address.name }})
                </span>
                <span class="text-slate-400">
                  {{ shortenHash(address.address) }}
                </span>
                <Copy icon-only :text="address.address" />
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="grid grid-cols-2 gap-4 px-7.5 py-5 sm:p-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="handleNext">
        Next
      </CommonButton>
    </div>
  </div>
</template>
