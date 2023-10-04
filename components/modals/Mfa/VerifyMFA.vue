<script setup lang="ts">
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfa: IMfa
  requestForTransaction: boolean
}>()

const emit = defineEmits(['resolve'])
const { signAndRequestMfaCode } = useAvocadoSafe()

const actualMfa = computed(() => props.mfa)

const otpValue = ref<string>()

async function onSubmit() {
  if (!actualMfa.value || !otpValue.value)
    return

  emit('resolve', true, {
    code: otpValue.value,
  })
}

async function handleRequest() {
  const success = await signAndRequestMfaCode(actualMfa.value, props.requestForTransaction)

  if (success) {
    notify({
      type: 'success',
      message: `OTP sent to your ${actualMfa.value.label}`,
    })
  }
  else {
    notify({
      type: 'error',
      message: `Failed to send OTP to your ${actualMfa.value.label}`,
    })
  }
}
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <div>
      <label for="otp">OTP</label>
      <VOtpInput v-model:value="otpValue" class="gap-2.5" input-classes="dark:bg-slate-800 rounded-lg bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 w-10 h-10 focus-within:ring-slate-100" separator="" should-auto-focus :num-inputs="6" />
    </div>
    <CommonButton class="w-24 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
      Submit
    </CommonButton>
    <CommonButton v-if="mfa.value !== 'totp'" class="w-24 justify-center" @click="handleRequest">
      Request OTP
    </CommonButton>
  </form>
</template>
