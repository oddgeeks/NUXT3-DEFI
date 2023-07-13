<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const props = defineProps<{
  addresses: ISignerAddress[]
}>()

const emit = defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useSafe())

function handleBack() {
  emit('destroy')
  openAddSignerModal(props.addresses)
}

async function handleNext() {
  emit('destroy')

  const { payload: selectedNetworks } = await openMultisigSelectNetworkModal(props.addresses)

  console.log(selectedNetworks)

  if (!selectedNetworks)
    return

  openSignSignerModal(props.addresses, selectedNetworks)
}
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        2
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Review Details
        </h1>
        <h2 class="text-xs leading-5 text-slate-400 font-medium">
          It might take a few minutes for new signers to be synced
        </h2>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">

    <table style="border-collapse: separate; border-spacing: 0 30px;" class="px-7.5">
      <tbody class="text-sm font-medium">
        <tr>
          <td class="text-slate-400 leading-[30px]">
            Address
          </td>
          <td>
            <span class="flex items-center gap-2.5 text-slate-400">
              {{ shortenHash(selectedSafe?.safe_address!) }}
              <Copy icon-only :text="selectedSafe?.safe_address!" />
            </span>
          </td>
        </tr>
        <tr>
          <td class="text-slate-400 pr-[60px] leading-[30px] align-baseline">
            New signers
          </td>
          <td>
            <ul class="flex flex-col gap-5">
              <li v-for="address in addresses" :key="address.address" class="flex gap-3 items-center">
                <AuthorityAvatar :address="address.address" />
                ({{ address.name }})
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

    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="handleNext">
        Next
      </CommonButton>
    </div>
  </div>
</template>
