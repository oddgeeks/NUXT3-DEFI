<script setup lang="ts">
defineProps<{
  chainId: number | string
}>()
const emit = defineEmits(['resolve'])
const nonce = ref<number | undefined>(-1)
const note = ref<string | undefined>(undefined)

const transactionTypes = [
  {
    name: 'Non-Sequential',
    value: -1,
  },
  {
    name: 'Sequential',
    value: undefined,
  },
]

function onSubmit() {
  emit('resolve', true, {
    nonce: nonce.value,
    note: note.value,
  })
}
</script>

<template>
  <form class="flex flex-col" @submit.prevent="onSubmit">
    <div class="px-7.5 pt-7.5 pb-5 flex flex-col gap-2.5">
      <h1 class="text-lg">
        Submit Transaction Proposal
      </h1>
      <div class="text-slate-500 flex items-center gap-2 text-xs font-medium">
        <ChainLogo class="w-5 h-5" :chain="chainId" />
        {{ chainIdToName(chainId) }}
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="px-7.5 py-5 flex flex-col gap-2.5">
      <div class="flex flex-col gap-2">
        <span class="text-xs text-slate-400">
          Transaction type
        </span>
        <CommonSelect
          v-model="nonce"
          label-key="name"
          value-key="value"
          :options="transactionTypes"
        >
          <template #button-suffix>
            <template v-if="nonce === -1">
              <SvgoInfo2 class="text-slate-500" />
              <span class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </template>
          </template>
          <template #item="{ label, value }">
            <span v-if="value === -1" class="flex items-center gap-2.5">
              {{ label }}
              <SvgoInfo2 class="text-slate-500" />
              <span class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </span>
          </template>
        </CommonSelect>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs text-slate-400">
          Note
        </span>
        <textarea v-model="note" placeholder="Visible to All signers" class="dark:bg-slate-800 placeholder:text-sm text-sm rounded-[14px] bg-slate-100 py-[15px] px-4 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0" />
      </div>
      <CommonButton class="justify-center mt-5" size="lg" type="submit">
        Send for Approval
      </CommonButton>
    </div>
  </form>
</template>
