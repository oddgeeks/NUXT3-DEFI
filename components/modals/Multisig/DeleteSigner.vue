<script setup lang=ts>
defineProps<{
  signer: ISigner
}>()

defineEmits(['resolve', 'destroy'])
</script>

<template>
  <div class="flex flex-col">
    <h1 class="text-lg flex gap-[14px] p-7.5">
      <SvgoTrash class="w-10 h-10" />
      Are you sure you want to delete the following signer?
    </h1>
    <hr class="border-slate-150 dark:border-slate-800">
    <p class="text-sm flex items-center gap-3 p-7.5">
      <AuthorityAvatar :address="signer.address" />
      <span class="text-slate-400 font-medium">
        {{ signer.address }}
      </span>
    </p>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="flex gap-4 p-7.5">
      <CommonButton size="lg" class="flex-1 justify-center" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton size="lg" color="red" class="flex-1 justify-center" @click="$emit('resolve', true)">
        Delete
      </CommonButton>
    </div>
  </div>
</template>
