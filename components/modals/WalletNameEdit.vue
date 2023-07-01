<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
}>()

const emit = defineEmits(['destroy'])
const walletName = useLocalStorage(`0x${props.safe?.safe_address}`, 'Personal')
const name = ref(walletName.value)

function onSave() {
  if (name.value === '' || name.value.length === 0 || !name.value) {
    openSnackbar({
      message: 'Wallet name can not be empty.',
      type: 'error',
    })
    return
  }
  if (name.value == walletName.value)
    emit('destroy')
  walletName.value = name.value
}

watch([walletName], () => {
  emit('destroy')
})
</script>

<template>
  <div class="flex flex-col gap-[30px]">
    <div class="flex flex-col gap-[12px]">
      <p class="text-[18px] leading-[20px] font-semibold text-center">
        Edit Wallet Note
      </p>
      <p class="text-[12px] leading-[20px] font-medium text-slate-400">
        This is stored locally, and is visible only to you
      </p>
    </div>
    <CommonInput
      v-model="name"
      name="WalletName"
      autofocus
      type="search"
      placeholder="Wallet Note"
    />
    <CommonButton class="flex items-center justify-center" @click="onSave">
      Save Changes
    </CommonButton>
  </div>
</template>
