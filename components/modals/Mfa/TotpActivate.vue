<script setup lang="ts">
const props = defineProps<{
  totp: ITotpData
}>()

const emit = defineEmits(['resolve'])
const pending = ref(false)

const { mfaTypes, verifyUpdateRequest } = useMfa()

const mfa = computed(() => mfaTypes.value.find(i => i.value == 'totp'))

async function handleContinue() {
  if (!mfa.value)
    return

  const { success } = await openVerifyMFAModal({
    mfa: mfa.value,
    mfaRequestType: 'update',
    verify: verifyUpdateRequest,
  })

  if (success) {
    openRegenerateTotpRecoveryCodeModal(props.totp.recovery_codes)
    emit('resolve', true)
  }

  else {
    notify({
      type: 'error',
      message: 'Failed to verify OTP',
    })
  }
}
</script>

<template>
  <div v-if="mfa" class="p-7.5">
    <div class="flex gap-[14px]">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <Component :is="mfa.icon" />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg">
          {{ mfa.title }}
        </h1>
        <h2 class="text-xs font-medium text-slate-400">
          {{ mfa.description }}
        </h2>
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <CommonQrImage class="mt-7.5" :url="totp.uri" />

      <Copy v-tippy="'Copy Secret'" class="mx-auto" :text="totp.secret">
        <template #content>
          {{ totp.secret }}
        </template>
      </Copy>
    </div>

    <CommonButton :loading="pending" class="mt-5 w-full justify-center" size="lg" @click="handleContinue">
      Continue
    </CommonButton>
  </div>
</template>
