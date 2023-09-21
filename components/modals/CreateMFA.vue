<script setup lang="ts">
import { ethers } from 'ethers'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import QrcodeVue from 'qrcode.vue'
import VOtpInput from 'vue3-otp-input'

const { selectedSafe } = storeToRefs(useSafe())
const { provider, account } = useWeb3()
const { avoProvider } = useSafe()

type Mfa = 'totp' | 'sms' | 'email'

const otpValue = ref<string>()

interface IMfaOtptResponse {
  algorithm: string
  digits: number
  period: number
  secret: string
  issuer: string
  label: string
  uri: string
}

const mfas = [
  {
    label: 'Google Authenticator',
    value: 'totp',
    type: 'Totp',
  },
  {
    label: 'SMS',
    value: 'sms',
    type: 'Phone',
  }, {
    label: 'Email',
    value: 'email',
    type: 'Email',
  },
]

const { handleSubmit, meta } = useForm({
  validationSchema: yup.object({
    email: yup.string().email().when('mfa', {
      is: 'email',
      then: yup.string().required(),
    }),
  }),
})

const totpResponse = ref<IMfaOtptResponse>()

const { value: mfa } = useField<Mfa>('mfa', undefined, {
  initialValue: 'totp',
})

const { value: email, errorMessage: emailErrorMessage } = useField('email')

const onSubmit = handleSubmit(async () => {
  const actualType = mfas.find(item => item.value === mfa.value)?.type

  if (!actualType)
    return

  const types = {
    Phone: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint32' },
      { name: 'countryCode', type: 'uint256' },
      { name: 'phone', type: 'uint256' },
    ],
    Email: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint32' },
      { name: 'email', type: 'string' },
    ],
    Totp: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint32' },
    ],
  } as any

  const domain = {
    name: 'Avocado MFA Update',
    version: '1.0.0',
    chainId: String(avoChainId),
    verifyingContract: selectedSafe.value?.safe_address,
  }

  const value = {
    Phone: {
      owner: account.value,
      index: 0,
      countryCode: 1,
      phone: 1234567890,
    },
    Email: {
      owner: account.value,
      index: 0,
      email: email.value,
    },
    Totp: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
    },
  } as any

  const data = value[actualType]

  const type = {
    [actualType]: types[actualType],
  }

  const browserProvider = new ethers.providers.Web3Provider(provider.value)

  console.log({
    domain,
    types: type,
    value: data,
  })

  const { signature, cancelled } = await signTypedData(browserProvider, account.value, {
    domain,
    types: type,
    value: data,
  })

  if (cancelled || !signature)
    return

  // const signer = ethers.utils.verifyTypedData(domain, type, data, signature)

  // console.log(signer)

  if (mfa.value === 'totp') {
    const resp: IMfaOtptResponse = await avoProvider.send('mfa_requestTotpAdd', [{
      data,
      signature,
    }])

    totpResponse.value = resp
  }
})

watch(otpValue, async () => {
  if (String(otpValue.value).length !== 6)
    return

  console.log({
    owner: selectedSafe.value?.owner_address,
    index: String(selectedSafe.value?.multisig_index),
    code: String(otpValue.value),
  })

  const resp = await avoProvider.send('mfa_verifyOtpAdd', [{
    owner: selectedSafe.value?.owner_address,
    index: String(selectedSafe.value?.multisig_index),
    code: otpValue.value,
  }])

  if (resp)
    alert('MFA enabled successfully!')
})
</script>

<template>
  <div class="p-7.5 flex flex-col gap-7.5">
    <form class="flex flex-col gap-7.5" @submit="onSubmit">
      <fieldset name="mfa" class="flex gap-4">
        <div v-for="item in mfas" :key="item.value" class="flex gap-2 items-center">
          <input :id="item.value" v-model="mfa" :value="item.value" type="radio" name="mfa">
          <label :for="item.value">{{ item.value }}</label>
        </div>
      </fieldset>
      <div v-if="mfa === 'email'">
        <label for="email">Email</label>
        <CommonInput id="email" v-model="email" :error-message="emailErrorMessage" type="email" class="w-full" />
      </div>
      <CommonButton :disabled="!meta.valid" type="submit">
        Enable MFA {{ mfa }}
      </CommonButton>
    </form>
    <div v-if="totpResponse" class="flex flex-col gap-7.5">
      <QrcodeVue :value="totpResponse.uri" :size="200" />

      <div>
        <label for="otp">OTP</label>
        <VOtpInput v-model:value="otpValue" separator="" input-classes="w-10 h-10 text-black" should-auto-focus :num-inputs="6" />
      </div>
    </div>
  </div>
</template>
