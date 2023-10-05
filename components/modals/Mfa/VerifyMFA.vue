<script setup lang="ts">
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfa: IMfa
  requestType: MfaRequestType
}>()

const emit = defineEmits(['resolve'])
const { signAndRequestTransactionMfaCode, signAndRequestDeleteMfaCode, signAndRequestUpdateMfaCode } = useMfa()

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
  let success = false

  console.log(props.requestType)

  if (props.requestType === 'update')
    success = await signAndRequestUpdateMfaCode(props.mfa)

  if (props.requestType === 'delete')
    success = await signAndRequestDeleteMfaCode(props.mfa)

  else if (props.requestType === 'transaction')
    success = await signAndRequestTransactionMfaCode(props.mfa)

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
  <form class="flex flex-col gap-5 p-7.5" @submit.prevent="onSubmit">
    <div>
      <label for="otp">OTP</label>
      <VOtpInput v-model:value="otpValue" class="gap-2.5" input-classes="dark:bg-slate-800 rounded-lg bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 w-10 h-10 focus-within:ring-slate-100" separator="" should-auto-focus :num-inputs="6" />
    </div>
    <div class="flex gap-5">
      <CommonButton class="w-24 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
        Submit
      </CommonButton>
      <CommonButton v-if="mfa.value !== 'totp'" class="justify-center" @click="handleRequest">
        Request OTP
      </CommonButton>
    </div>
  </form>
</template>
