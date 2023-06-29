<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const props = defineProps<{
  addresses: string[]
  defaultTreshold: number
}>()

const emit = defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useAuthorities())

function handleBack() {
  emit('destroy')
  openAddSignerModal(props.addresses, props.defaultTreshold)
}

function handleNext() {
  emit('destroy')
  openSignSignerModal(props.addresses, props.defaultTreshold)
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
              <li v-for="address in addresses" :key="address" class="flex gap-3 items-center">
                <AuthorityAvatar :address="address" />
                <span class="text-slate-400">
                  {{ shortenHash(address) }}
                </span>
                <Copy icon-only :text="address" />
              </li>
            </ul>
          </td>
        </tr>
        <tr>
          <td class=" text-slate-400 leading-[30px]">
            Treshold
          </td>
          <td>
            <span class="flex gap-3 items-center">
              <SvgoUserCircle class="w-5 h-5 text-slate-400" />
              {{ defaultTreshold }} out of {{ addresses.length }} signer(s)
            </span>
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
