<script setup lang="ts">
import { serialize } from 'error-serializer'
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfa: IMfa
  mfaRequestType: MfaRequestType
  verify?: (mfa: IMfa, code: string) => Promise<boolean>
  request?: () => Promise<IMfaResponse>
  defaultSessionAvailable?: boolean
  forceGrabSession?: boolean
  authenticate?: boolean
  inputValue?: any
  expire?: MfaExpire
  chainId?: number | string
}>()

const emit = defineEmits(['resolve', 'destroy'])
const { mfaTypes, backupSigner, backupMfa } = useMfa()

const actualMfa = computed(() => props.mfa)
const { $t } = useNuxtApp()

const otpValue = ref<string>()
const pending = ref(false)

const { dec, count, reset } = useCounter(60, { min: 0, max: 60 })

const sessionAvailable = ref(props.defaultSessionAvailable || false)
const availableMfas = computed(() => mfaTypes.value.filter(i => i.activated && i.value !== props.mfa.value && i.value !== 'backup'))

const isBackupSignerAvailable = computed(() => {
  if (!props.chainId || !backupSigner.value?.chainIds)
    return false

  return backupSigner.value?.chainIds?.some(i => String(i) === String(props.chainId))
})

useIntervalFn(() => dec(), 1000)

const buttonLabel = computed(() => {
  const obj: Record<MfaRequestType, string> = {
    delete: `Remove ${props.mfa.label}`,
    transaction: 'Confirm transaction',
    update: 'Verify',
    key: 'Confirm',
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
          message: $t('mfa.notifications.incorrectOTP'),
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
    const parsed: any = serialize(e)

    openSnackbar({
      message: parsed?.error?.message || parsed.message,
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

  const otpSentMessageKey = actualMfa.value?.otpSentNotificationKey || 'mfa.notifications.OTPSent'

  if (isSuccess) {
    notify({
      type: 'success',
      message: $t(otpSentMessageKey, { method: actualMfa.value.label }),
    })
  }
  else {
    notify({
      type: 'error',
      message: $t('mfa.notifications.OTPSentFailed', { method: actualMfa.value.label }),
    })
  }

  reset()
}

async function handleTryAnotherMethod() {
  const { success, payload } = await openMfaAuthenticateModal(props.mfaRequestType, actualMfa.value, props.chainId)

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
          <h2 v-if="mfa.value !== 'totp'" class="text-xs font-medium leading-5 text-gray-400">
            A 6 digit code has been sent to <span v-if="value"> {{ value }}</span> <span v-else class="lowercase">your {{ mfa.value }}.</span>
          </h2>
        </div>
      </div>
      <VOtpInput v-model:value="otpValue" should-auto-focus class="otp-wrapper justify-center gap-2.5" input-classes="bg-gray-900 rounded-[14px] border-0 focus-within:ring-1 focus-within:bg-gray-850  focus-within:ring-slate-750 px-0 py-0 w-12 h-12 sm:px-4 sm:py-[15px] text-center sm:w-[58px] sm:h-[50px]" separator="" :num-inputs="6" />
    </div>
    <label v-if="props.mfaRequestType === 'transaction' && !forceGrabSession" class="mt-2.5 flex cursor-pointer items-center gap-2.5 text-xs" for="input-session">
      <input id="input-session" v-model="sessionAvailable" class="peer sr-only" type="checkbox">
      <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle h-5 w-5 shrink-0 cursor-pointer text-gray-400" />
      <span :class="!sessionAvailable ? 'text-gray-500' : ''">
        Don’t ask for OTP verification for the next {{ expire ? parseInt(expire) : '30' }} min. <span v-if="defaultSessionAvailable"> (Recommended) </span>
      </span>
    </label>

    <div class="flex w-full gap-5">
      <CommonButton :loading="pending" size="lg" :color="mfaRequestType === 'delete' ? 'red' : 'primary'" class="flex-1 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
        {{ buttonLabel }}
      </CommonButton>
    </div>
    <div class="flex justify-between empty:hidden">
      <button v-if="mfa.value !== 'totp'" type="button" :disabled="!!count" class="text-left text-xs font-medium leading-5 text-primary only:m-auto disabled:text-gray-400" @click="handleRequest">
        Resend OTP
        <span v-if="count">
          in {{ count }} secs
        </span>
      </button>
      <button v-if="authenticate && !!availableMfas.length" class="text-left text-xs font-medium leading-5 text-primary" type="button" @click="handleTryAnotherMethod">
        Try another verification method
      </button>
      <button
        v-if="authenticate && isBackupSignerAvailable && !availableMfas.length" class="text-left text-xs font-medium leading-5 text-primary" type="button" @click="$emit('resolve', true, {
          fallbackMfa: backupMfa,
        })"
      >
        Use Backup Signer
      </button>
      <button v-if="mfa.value === 'totp' && mfaRequestType === 'delete'" class="text-xs font-medium leading-5 text-primary" @click="handleDeactivateWithRecoveryCode">
        Use Recovery codes
      </button>
    </div>
  </form>
</template>
