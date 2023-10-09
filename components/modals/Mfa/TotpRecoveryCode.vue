<script setup lang="ts">
const props = defineProps<{
  recoverycodes?: string[]
}>()

const { mfaTypes, regenerateTotpRecoveryCode } = useMfa()

const recoveryCodes = ref<string[]>(props.recoverycodes || [])

const loading = ref({
  regenerate: false,
  disable: false,
})

async function regenerateRecoveryCodes() {
  try {
    loading.value.regenerate = true
    const mfa = mfaTypes.value.find(i => i.value === 'totp')

    if (!mfa)
      return

    const { success, payload } = await openVerifyMFAModal({
      mfa,
      mfaRequestType: 'delete',
      verify: regenerateTotpRecoveryCode,
    })

    if (!success)
      return

    recoveryCodes.value = payload?.resp?.recovery_codes
  }
  catch (e: any) {
    openSnackbar({
      message: e?.message,
      type: 'error',
    })
  }
  finally {
    loading.value.regenerate = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-7.5 p-7.5">
    <div class="flex gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoKey />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          Fallback recovery codes
        </h1>
        <h2 class="text-xs font-medium leading-5 text-slate-400">
          We strongly recommend you to save these codes in a safe place. You can use these codes to recover your account if you lose access to your 2FA device.
        </h2>
      </div>
    </div>
    <div class="relative">
      <Copy class="absolute right-4 top-4" :text="recoveryCodes.join(',')" />
      <ul v-if="recoveryCodes.length" class="grid grid-cols-2 gap-4 rounded-[14px] bg-slate-50 p-5 text-slate-500 dark:bg-gray-850">
        <li v-for="code in recoveryCodes" :key="code" class="text-xs font-medium leading-5">
          {{ code }}
        </li>
      </ul>
    </div>
    <div class="flex flex-col gap-4">
      <CommonButton :loading="loading.regenerate" class="items-center justify-center" size="lg" @click="regenerateRecoveryCodes">
        Regenerate recovery codes
      </CommonButton>
    </div>
  </div>
</template>
