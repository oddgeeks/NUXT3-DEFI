<script lang="ts" setup>
defineProps<{
  signer: ISigner
}>()
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-7.5">
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Sign Transaction
        </h1>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">

    <ul class="p-7.5 flex flex-col gap-7">
      <MultisigSignDeleteSignerItem v-for="chain in signer.chainIds" :key="chain" :address="signer.address" :chain-id="chain" />
    </ul>
  </div>
</template>
