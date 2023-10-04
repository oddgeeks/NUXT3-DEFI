<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import VOtpInput from 'vue3-otp-input'

const props = defineProps<{
  mfaType: IMfa
}>()

defineEmits(['destroy'])

const actualMfa = computed(() => props.mfaType)

const phoneRegexp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const { selectedSafe, atLeastOneMfaVerifed } = storeToRefs(useSafe())
const { account, library } = useWeb3()
const { avoProvider, fetchSafeInstanceses } = useSafe()

const otpValue = ref<string>()
const mfaRequestResponse = ref<IMfaResponse>()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

const { handleSubmit, meta, isSubmitting } = useForm({
  validationSchema: yup.object({
    email: yup.string().email().when('mfa', {
      is: 'email',
      then: yup.string().required(),
    }),
    phone: yup.string().when('mfa', {
      is: 'phone',
      then: yup.string().matches(phoneRegexp, 'Phone number is not valid').required(),
    }),
  }),
})
useField<Mfa>('mfa', undefined, {
  initialValue: actualMfa.value.value,
})
const { value: email, errorMessage: emailErrorMessage } = useField('email')
const { value: phone, errorMessage: phoneErrorMessage } = useField('phone')
const { value: countryCode } = useField('countryCode', undefined, {
  initialValue: '1',
})

const country = computed(() => {
  return countries.find(c => c.dialCode === countryCode.value)
})

const onSubmit = handleSubmit(async () => {
  if (!actualMfa.value)
    return

  const domain = {
    name: 'Avocado MFA Update',
    version: '1.0.0',
    chainId: String(avoChainId),
    verifyingContract: selectedSafe.value?.safe_address,
  }

  const value = {
    phone: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      countryCode: countryCode.value,
      phone: phone.value,
      mfaType: '',
      mfaCode: '',
    },
    email: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      email: email.value,
      mfaType: '',
      mfaCode: '',
    },
    totp: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      mfaType: '',
      mfaCode: '',
    },
  } as any

  const data = value[actualMfa.value.value]

  const payload = {
    domain,
    types: actualMfa.value.types,
    value: data,
  }

  if (atLeastOneMfaVerifed.value) {
    const { success, payload } = await openMfaAuthenticateModal({})
    if (!success && !payload?.mfa)
      return

    const mfa: IMfa = payload?.mfa

    const { success: verifySuccess, payload: verifyPayload } = await openVerifyMFAModal(mfa)

    if (!verifySuccess || !verifyPayload?.code)
      return

    data.mfaType = mfa.value
    data.mfaCode = verifyPayload.code
  }

  const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

  if (cancelled || !signature)
    return

  const resp: IMfaResponse = await avoProvider.send('mfa_requestUpdate', [{
    type: actualMfa.value.value,
    data,
    signature,
  }])

  if (!resp.status) {
    openSnackbar({
      message: 'MFA request failed',
      type: 'error',
    })
    return
  }

  mfaRequestResponse.value = resp
})

async function verify() {
  if (!actualMfa.value || !otpValue.value)
    return

  const verifed = await avoProvider.send('mfa_verifyUpdate', [{
    type: actualMfa.value.value,
    owner: selectedSafe.value?.owner_address,
    index: String(selectedSafe.value?.multisig_index),
    code: otpValue.value,
  }])

  if (verifed) {
    await fetchSafeInstanceses()
    openSnackbar({
      message: 'MFA enabled',
      type: 'success',
    })
  }

  else {
    openSnackbar({
      message: 'MFA verification failed',
      type: 'error',
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 p-7.5">
    <form class="flex flex-col gap-7.5" @submit="onSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-lg">
          {{ actualMfa.title }}
        </h1>
        <h2 class="text-xs font-medium text-slate-400">
          {{ actualMfa.description }}
        </h2>
      </div>

      <template v-if="!mfaRequestResponse">
        <div v-if="actualMfa.value === 'email'" class="flex flex-col gap-2.5">
          <label class="text-sm leading-5" for="input-email">Email</label>
          <CommonInput id="email" v-model="email" autofocus name="email" :error-message="emailErrorMessage" type="email" class="w-full" />
        </div>
        <div v-else-if="actualMfa.value === 'phone'" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2.5">
            <label class="text-sm leading-5" for="input-phone">Phone</label>
            <div class="flex w-full items-baseline">
              <CommonInput id="phone" v-model="phone" name="phone" autofocus placeholder="0000 0000" :error-message="phoneErrorMessage" container-classes="!px-0" class="w-full">
                <template #prefix>
                  <CommonSelect v-model="countryCode" container-classes="!py-0 !bg-transparent !border-0" list-classes="!w-[400%]" searchable label-key="name" value-key="dialCode" :options="countries">
                    <template #button-label>
                      <Flag v-if="country" class="h-5 w-5" :flag="country?.iso2.toUpperCase()" />
                    </template>
                    <template #item="{ item }">
                      <Flag v-if="item" class="h-5 w-5" :flag="item?.iso2.toUpperCase()" />
                      {{ item.name }}
                    </template>
                  </CommonSelect>
                </template>
              </CommonInput>
            </div>
          </div>
        </div>
        <div class="flex justify-center gap-4">
          <CommonButton color="white" size="lg" class="flex-1 justify-center" @click="$emit('destroy')">
            Close
          </CommonButton>
          <CommonButton size="lg" :loading="isSubmitting" class="flex-1 justify-center" :disabled="!meta.valid" type="submit">
            {{ actualMfa.value === 'totp' ? 'Generate QR Code' : 'Continue' }}
          </CommonButton>
        </div>
      </template>
    </form>
    <div v-if="mfaRequestResponse?.data?.uri" class="flex flex-col gap-5">
      <Copy :text="mfaRequestResponse?.data?.secret">
        <template #content>
          Copy Secret
        </template>
      </Copy>
      <CommonQrImage :url="mfaRequestResponse?.data?.uri" />
    </div>

    <form v-if="mfaRequestResponse" class="flex flex-col gap-5" @submit.prevent="verify">
      <div>
        <label for="otp">OTP</label>
        <VOtpInput v-model:value="otpValue" class="gap-2.5" input-classes="dark:bg-slate-800 rounded-lg bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 w-10 h-10 focus-within:ring-slate-100" separator="" should-auto-focus :num-inputs="6" />
      </div>
      <CommonButton class="w-24 justify-center" type="submit" :disabled="String(otpValue).length !== 6">
        Verify
      </CommonButton>
    </form>
  </div>
</template>
