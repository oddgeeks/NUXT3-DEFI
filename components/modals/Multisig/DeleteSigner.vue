<script setup lang=ts>
defineProps<{
  signers: ISigner[]
}>()

defineEmits(['resolve', 'destroy'])
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg text-center">
      Delete Signers
    </h1>
    <h2 class="text-sm">
      Are you sure you want to delete the following signers?
    </h2>
    <div>
      <ul class="gap-4 flex flex-col">
        <li v-for="signer in signers" :key="signer.address" class="text-sm flex items-center gap-2">
          <AuthorityAvatar :address="signer.address" />
          {{ signer.address }}
        </li>
      </ul>
    </div>
    <div class="flex gap-4">
      <CommonButton size="lg" class="flex-1 justify-center" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton size="lg" color="red" class="flex-1 justify-center" @click="$emit('resolve', true)">
        Delete
      </CommonButton>
    </div>
  </div>
</template>
