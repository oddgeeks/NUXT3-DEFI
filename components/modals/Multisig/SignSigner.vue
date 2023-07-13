<script lang="ts" setup>
const props = defineProps<{
  addresses: ISignerAddress[]
  chainIds: number[]
}>()

const emit = defineEmits(['destroy'])

async function handleBack() {
  emit('destroy')
  openReviewSignerModal(props.addresses)
}
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        3
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Sign on networks to proceed
        </h1>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="p-7.5 flex flex-col gap-7">
      <MultisigSignAddSignerItem v-for="chainId in chainIds" :key="chainId" :chain-id="chainId" :addresses="addresses" />
    </ul>
    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
    </div>
  </div>
</template>
