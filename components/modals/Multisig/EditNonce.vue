<script setup lang="ts">
const emit = defineEmits(['resolve'])

const note = ref('')
const nonce = ref('')

function onSubmit() {
  console.log('nonce', nonce.value)
  console.log('note', note.value)

  emit('resolve', true, {
    nonce: nonce.value,
    note: note.value,
  })
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div>
      <span class="text-xs">Nonce</span>
      <CommonInput v-model="nonce" autofocus />
    </div>
    <div>
      <span class="text-xs">Note</span>
      <CommonInput v-model="note" />
    </div>

    <CommonButton class="justify-center" size="lg" type="submit">
      Submit
    </CommonButton>
  </form>
</template>
