<script setup lang="ts">
const props = defineProps<{
  recoverycodes?: string[]
}>()

defineEmits(['resolve'])

const { mfaTypes, regenerateTotpRecoveryCode } = useMfa()

const understand = ref(false)

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
      mfaRequestType: 'update',
      verify: regenerateTotpRecoveryCode,
    })

    if (!success)
      return

    recoveryCodes.value = payload?.resp?.recovery_codes

    openSnackbar({
      message: 'Recovery codes regenerated successfully',
      type: 'success',
    })
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
    <div class="flex flex-col gap-7.5">
      <div class="flex gap-[14px]">
        <CommonTxTypeIcon class="h-10 w-10">
          <template #icon>
            <SvgoKey />
          </template>
        </CommonTxTypeIcon>
        <div class="flex flex-col gap-2.5">
          <h1 class="text-lg leading-[20px]">
            Fallback recovery codes
          </h1>
          <h2 class="text-xs font-medium leading-5 text-slate-400">
            We strongly recommend you to save these codes in a safe place. You can use these codes to recover your account if you lose access to your 2FA device.
          </h2>
        </div>
      </div>
      <div class="relative flex flex-col gap-5">
        <Copy icon-only class="absolute right-4 top-4" :text="recoveryCodes.join(',')" />
        <ul v-if="recoveryCodes.length" class="grid grid-cols-2 gap-4 rounded-[14px] bg-slate-50 p-5 dark:bg-gray-850">
          <li v-for="code in recoveryCodes" :key="code" class="text-center text-xs font-medium leading-5">
            {{ code }}
          </li>
        </ul>
        <button type="button" :loading="loading.regenerate" class="text-xs font-medium text-slate-400" @click="regenerateRecoveryCodes">
          Regenerate recovery codes
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <label class="mt-2.5 flex cursor-pointer gap-2.5 text-xs" for="input-session">
        <input id="input-session" v-model="understand" class="peer sr-only" type="checkbox">
        <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-1 h-5 w-5 shrink-0 cursor-pointer text-slate-400" />
        <span class="font-medium leading-5">
          I understand that I will not be able to recover my account if I lose access to my 2FA device and recovery codes.
        </span>
      </label>

      <CommonButton :disabled="!understand" size="lg" class="justify-center" @click="$emit('resolve', true)">
        Confirm
      </CommonButton>
    </div>
  </div>
</template>
