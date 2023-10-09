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
        message: 'Failed to deactivate TOTP',
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
    <div class="flex gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoLock />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          Deactivate TOTP
        </h1>
        <h2 class="text-xs font-medium leading-5 text-slate-400">
          Enter your recovery code to deactivate TOTP
        </h2>
      </div>
    </div>
    <CommonInput v-model="recoveryCode" placeholder="Recovery code" label="Recovery code" name="recovery-code" />

    <CommonButton :loading="pending" :disabled="!recoveryCode" size="lg" class="items-center justify-center" color="red" @click="handleDeactivate">
      Deactivate
    </CommonButton>
  </div>
</template>
