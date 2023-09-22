<script setup lang="ts">
import { ethers } from 'ethers'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import VOtpInput from 'vue3-otp-input'

const phoneRegexp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const { selectedSafe, mfaEmailVerifed, mfaPhoneVerifed, mfaTotpVerifed, atLeastOneMfaVerifed } = storeToRefs(useSafe())
const { provider, account } = useWeb3()
const { avoProvider } = useSafe()

const otpValue = ref<string>()
const mfaRequestResponse = ref<IMfaResponse>()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

const mfas = computed(() =>
  [
    {
      value: 'totp',
      types: {
        Totp: [
          { name: 'owner', type: 'address' },
          { name: 'index', type: 'uint32' },
        ],
      },
      requestMethod: 'mfa_requestTotpAdd',
      verifyMethod: 'mfa_verifyTotpAdd',
      disabled: mfaTotpVerifed.value,
    },
    {
      value: 'phone',
      types: {
        Phone: [
          { name: 'owner', type: 'address' },
          { name: 'index', type: 'uint32' },
          { name: 'countryCode', type: 'uint256' },
          { name: 'phone', type: 'uint256' },
        ],
      },
      requestMethod: 'mfa_requestPhoneAdd',
      verifyMethod: 'mfa_verifyPhoneAdd',
      disabled: mfaPhoneVerifed.value,

    }, {
      value: 'email',
      types: {
        Email: [
          { name: 'owner', type: 'address' },
          { name: 'index', type: 'uint32' },
          { name: 'email', type: 'string' },
        ],
      },
      requestMethod: 'mfa_requestEmailAdd',
      verifyMethod: 'mfa_verifyEmailAdd',
      disabled: mfaEmailVerifed.value,
    },
  ] as IMfa[],
)

const enabledMfas = computed(() => mfas.value.filter(item => !item.disabled))

const actualMfa = computed(() => mfas.value.find(item => item.value === mfa.value))

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

const { value: mfa } = useField<Mfa>('mfa', undefined, {
  initialValue: enabledMfas.value[0]?.value,
})

const { value: email, errorMessage: emailErrorMessage } = useField('email')
const { value: phone, errorMessage: phoneErrorMessage } = useField('phone')
const { value: countryCode } = useField('countryCode', undefined, {
  initialValue: '90',
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
    },
    email: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      email: email.value,
    },
    totp: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
    },
  } as any

  const data = value[actualMfa.value.value]

  const browserProvider = new ethers.providers.Web3Provider(provider.value)

  const payload = {
    domain,
    types: actualMfa.value.types,
    value: data,
  }

  console.log({ payload })

  const { signature, cancelled } = await signTypedData(browserProvider, account.value, payload)

  if (cancelled || !signature)
    return

  const resp: IMfaResponse = await avoProvider.send(actualMfa.value.requestMethod, [{
    data,
    signature,
  }])

  mfaRequestResponse.value = resp
})

watch(mfa, () => {
  otpValue.value = ''
  mfaRequestResponse.value = undefined
})

async function verify() {
  if (!actualMfa.value || !otpValue.value)
    return

  const verifed = await avoProvider.send(actualMfa.value?.verifyMethod, [{
    owner: selectedSafe.value?.owner_address,
    index: String(selectedSafe.value?.multisig_index),
    code: otpValue.value,
  }])

  if (verifed) {
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
  <div class="p-7.5 flex flex-col gap-5">
    <form class="flex flex-col gap-5" @submit="onSubmit">
      <fieldset name="mfa" class="flex gap-4">
        <div v-for="item in mfas" :key="item.value" class="flex gap-2 items-center">
          <input :id="item.value" v-model="mfa" class="peer" :disabled="item.disabled" :value="item.value" type="radio" name="mfa">
          <label class="peer-disabled:text-slate-400" :for="item.value">{{ item.value }}</label>
        </div>
      </fieldset>
      <template v-if="!mfaRequestResponse">
        <div v-if="mfa === 'totp'">
          <p class="text-sm font-medium">
            After enabling MFA, you will be asked to scan a QR code with your authenticator app.
          </p>
        </div>
        <div v-else-if="mfa === 'email'">
          <label for="email">Email</label>
          <CommonInput id="email" v-model="email" :error-message="emailErrorMessage" type="email" class="w-full" />
        </div>
        <div v-else-if="mfa === 'phone'" class="flex flex-col gap-5">
          <div>
            <label for="countryCode">Country Code</label>
            <CommonSelect v-model="countryCode" searchable label-key="name" value-key="dialCode" :options="countries" />
          </div>
          <div>
            <label for="phone">Phone</label>
            <CommonInput id="phone" v-model="phone" :error-message="phoneErrorMessage" class="w-full" />
          </div>
        </div>

        <div v-else>
          All MFA methods are enabled
        </div>
        <CommonButton :loading="isSubmitting" class="w-36 justify-center" :disabled="!meta.valid" type="submit">
          Enable
        </CommonButton>
      </template>
    </form>
    <div v-if="mfaRequestResponse?.uri" class="flex flex-col gap-5">
      <Copy :text="mfaRequestResponse.uri">
        <template #content>
          Copy MFA URI
        </template>
      </Copy>
      <CommonQrImage :url="mfaRequestResponse.uri" />
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

    <button
      v-if="atLeastOneMfaVerifed" class="text-primary text-sm" type="button" @click="openAddSignerModal({
        addresses: [
          {
            address: '0xEA524E38e56c48789e27E78f9FF9F33BD0dd530E',
            name: 'Instadapp Signer',
          },
        ],
      })"
    >
      Add Signer to enable MFA
    </button>
  </div>
</template>
