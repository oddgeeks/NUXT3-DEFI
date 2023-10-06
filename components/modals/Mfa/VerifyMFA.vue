<script setup lang="ts">
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfa: IMfa
  request?: (mfa: IMfa) => Promise<IMfaResponse>
}>()

const emit = defineEmits(['resolve'])
const actualMfa = computed(() => props.mfa)
const otpValue = ref<string>()

const { dec, count } = useCounter(60, { min: 0, max: 60 })

useIntervalFn(() => dec(), 1000)

async function onSubmit() {
  if (!actualMfa.value || !otpValue.value)
    return

  emit('resolve', true, {
    code: otpValue.value,
  })
}

async function handleRequest() {
  if (!props.request)
    return

  const result = await props.request(actualMfa.value)

  const isSuccess = typeof result === 'object' ? result?.status : result

  if (isSuccess) {
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
      <label class="mb-7.5 block text-lg" for="otp">Enter TOTP provided by {{ mfa.label }}</label>
      <VOtpInput v-model:value="otpValue" class="otp-wrapper gap-2.5" input-classes="dark:bg-slate-800 rounded-lg bg-slate-100 border-0 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 w-10 h-10 focus-within:ring-slate-100" separator="" should-auto-focus :num-inputs="6" />
    </div>
    <div class="flex w-full gap-5">
      <CommonButton class="flex-1 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
        Submit
      </CommonButton>
      <CommonButton v-if="mfa.value !== 'totp'" :disabled="!!count" class="flex-1 justify-center" @click="handleRequest">
        Resend OTP
        <span v-if="count" class="ml-1">
          ({{ count }})
        </span>
      </CommonButton>
    </div>
  </form>
</template>
