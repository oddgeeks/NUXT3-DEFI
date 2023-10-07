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

  const { success, payload } = await openVerifyMFAModal({
    mfa: mfa.value,
    mfaRequestType: 'update',
  })

  if (success && payload.code) {
    const verifed = await verifyUpdateRequest(mfa.value, payload.code)

    if (verifed) {
      openRegenerateTotpRecoveryCodeModal(props.totp.recovery_codes)
      emit('resolve', true)
    }
    else {
      notify({
        type: 'error',
        message: 'Invalid code',
      })
    }
  }
}
</script>

<template>
  <div v-if="mfa" class="p-7.5">
    <div class="flex flex-col gap-1">
      <h1 class="text-lg">
        {{ mfa.title }}
      </h1>
      <h2 class="text-xs font-medium text-slate-400">
        {{ mfa.description }}
      </h2>
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
