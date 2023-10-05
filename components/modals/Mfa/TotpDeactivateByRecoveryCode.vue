<script setup lang="ts">
const emit = defineEmits(['destroy', 'resolve'])
const recoveryCode = ref<string>()
const pending = ref(false)
const { removeTotpUsingRecoveryCode } = useMfa()

async function handleDeactivate() {
  try {
    if (!recoveryCode.value)
      throw new Error('Recovery code is required')

    pending.value = true

    const success = await removeTotpUsingRecoveryCode(recoveryCode.value)

    if (success) {
      emit('resolve', true)
    }
    else {
      notify({
        type: 'error',
        message: 'Failed to deactivate OTPT',
      })
    }
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 p-7.5">
    <h1 class="">
      Recovery code
    </h1>
    <CommonInput v-model="recoveryCode" label="Recovery code" name="recovery-code" />

    <CommonButton :loading="pending" :disabled="!recoveryCode" size="lg" class="items-center justify-center" color="red" @click="handleDeactivate">
      Deactivate
    </CommonButton>
  </div>
</template>
