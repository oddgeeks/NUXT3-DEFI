<script setup lang="ts">
import { serialize } from 'error-serializer'
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfa: IMfa
  mfaRequestType: MfaRequestType
  verify?: (mfa: IMfa, code: string) => Promise<boolean>
  request?: () => Promise<IMfaResponse>
  defaultSessionAvailable?: boolean
  authenticate?: boolean
  inputValue?: any
  expire?: MfaExpire
}>()

const emit = defineEmits(['resolve', 'destroy'])

const actualMfa = computed(() => props.mfa)

const otpValue = ref<string>()
const pending = ref(false)

const { dec, count, reset } = useCounter(60, { min: 0, max: 60 })

const sessionAvailable = ref(props.defaultSessionAvailable || false)

useIntervalFn(() => dec(), 1000)

const buttonLabel = computed(() => {
  const obj: Record<MfaRequestType, string> = {
    delete: `Remove ${props.mfa.label}`,
    transaction: 'Confirm transaction',
    update: 'Verify',
  }

  return obj[props.mfaRequestType]
})

const value = computed(() => {
  if (!props.inputValue)
    return

  const email = props.inputValue?.email
  const phone = props.inputValue?.phone
  const countryCode = props.inputValue?.countryCode

  return email || (phone ? `+${countryCode} ${phone}` : '')
})

async function onSubmit() {
  if (!actualMfa.value || !otpValue.value)
    return

  try {
    pending.value = true

    let resp

    if (typeof props.verify === 'function') {
      resp = await props.verify(actualMfa.value, otpValue.value)

      if (!resp) {
        return openSnackbar({
          message: 'Incorrect OTP, please retry',
          type: 'error',
        })
      }
    }

    emit('resolve', true, {
      code: otpValue.value,
      resp,
      sessionAvailable: sessionAvailable.value,
    })
  }
  catch (e) {
    const parsed = serialize(e)

    openSnackbar({
      message: parsed.message,
      type: 'error',
    })
  }
  finally {
    pending.value = false
  }
}

async function handleRequest() {
  if (!props.request)
    return

  const result = await props.request()

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

  reset()
}

async function handleTryAnotherMethod() {
  const { success, payload } = await openMfaAuthenticateModal(props.mfaRequestType)

  if (success && payload?.mfa) {
    emit('resolve', true, {
      fallbackMfa: payload.mfa,
    })
  }
}

async function handleDeactivateWithRecoveryCode() {
  try {
    const { success } = await openDeactivateTotpByRecoveryCodes()

    if (!success)
      return

    emit('resolve', success)
  }
  catch (e) {
    emit('destroy')
  }
}
</script>

<template>
  <form class="flex flex-col gap-5 p-7.5" @submit.prevent="onSubmit">
    <div>
      <div class="flex gap-[14px]">
        <CommonTxTypeIcon class="h-10 w-10">
          <template #icon>
            <Component :is="mfa.icon" class="text-white" />
          </template>
        </CommonTxTypeIcon>
        <div class="mb-7.5 flex flex-col gap-2.5">
          <h1 class="block text-lg leading-[30px] sm:max-w-xs">
            {{ mfa.enterOtpLabel }}
            <span v-if="mfaRequestType === 'transaction'">
              to confirm the transaction
            </span>
          </h1>
          <h2 v-if="mfa.value !== 'totp'" class="text-xs font-medium leading-5 text-slate-400">
            A 6 digit code has been sent to <span v-if="value"> {{ value }}</span> <span v-else class="lowercase">your {{ mfa.value }}.</span>
          </h2>
        </div>
      </div>
      <VOtpInput v-model:value="otpValue" should-auto-focus class="otp-wrapper gap-2.5" input-classes="dark:bg-slate-800 rounded-[14px] bg-slate-100 border-0 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 px-4 py-[15px] text-center w-[58px] h-[50px] focus-within:ring-slate-100" separator="" :num-inputs="6" />
    </div>
    <label v-if="props.mfaRequestType === 'transaction'" class="mt-2.5 flex cursor-pointer items-center gap-2.5 text-xs" for="input-session">
      <input id="input-session" v-model="sessionAvailable" class="peer sr-only" type="checkbox">
      <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle h-5 w-5 shrink-0 cursor-pointer text-slate-400" />
      <span :class="!sessionAvailable ? 'text-slate-500' : ''">
        Don’t ask for OTP verification for the next {{ expire ? parseInt(expire) : '30' }} min. <span v-if="defaultSessionAvailable"> (Recommended) </span>
      </span>
    </label>

    <div class="flex w-full gap-5">
      <CommonButton :loading="pending" size="lg" :color="mfaRequestType === 'delete' ? 'red' : 'primary'" class="flex-1 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
        {{ buttonLabel }}
      </CommonButton>
    </div>
    <div class="flex justify-between">
      <button v-if="mfa.value !== 'totp'" type="button" :disabled="!!count" class="text-left text-xs font-medium leading-5 text-primary disabled:text-slate-400" @click="handleRequest">
        Resend OTP
        <span v-if="count">
          in {{ count }} secs
        </span>
      </button>
      <button v-if="authenticate" class="text-left text-xs font-medium leading-5 text-primary" type="button" @click="handleTryAnotherMethod">
        Try another verification method
      </button>
      <button v-if="mfa.value === 'totp' && mfaRequestType === 'delete'" class="text-xs font-medium leading-5 text-primary" @click="handleDeactivateWithRecoveryCode">
        Use Recovery codes
      </button>
    </div>
  </form>
</template>
