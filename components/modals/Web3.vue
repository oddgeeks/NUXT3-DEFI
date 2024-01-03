<script setup lang="ts">
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { ethers } from 'ethers'

defineProps<{
  buttonClass?: string
}>()
const emit = defineEmits(['destroy'])
const router = useRouter()
const { activate, account } = useWeb3()

const { trackingAccount } = useAccountTrack()

const { providers } = useNetworks()
const { setConnectorName } = useConnectors()

const loading = ref<Record<string, boolean>>({})

const {
  handleSubmit,
  isSubmitting,
  meta: formMeta,
} = useForm({
  validationSchema: yup.object({
    address: yup.string()
      .required('')
      .test('is-address', 'Invalid address', (value) => {
        if (!value)
          return false

        console.log(value)

        try {
          ethers.utils.getAddress(value)
          return true
        }
        catch (e) {
          return false
        }
      }),
  }),
})

const { value: address, errorMessage } = useField<string>('address')

async function connect(provider: any) {
  try {
    loading.value[provider.name] = true
    await activate(await provider.connect(), undefined, true)

    const userNonce = useCookie<string | null>(`nonce-${account.value}`)
    const referral = useCookie<string | null>('ref-code')

    if (!userNonce.value || referral.value) {
      const { success } = await openRequestTermsSignature(provider.id)

      if (!success)
        throw new Error('Failed to sign terms')
    }

    setConnectorName(provider.id)
    emit('destroy')
  }
  catch (e) {
    console.log(e)
  }
  finally {
    loading.value[provider.name] = false
  }
}

function isProviderVisible(provider: Provider) {
  if (process.client) {
    if (provider.id === 'injected' && !window.ethereum)
      return false
    return true
  }
}

const onSubmit = handleSubmit(() => {
  trackingAccount.value = address.value

  router.push('/')
})
</script>

<template>
  <div class="relative">
    <slot name="title">
      <div class="mb-7 flex flex-col items-center justify-center gap-4">
        <span class="text-lg">Connect wallet</span>
      </div>
    </slot>

    <ul class="grid gap-[15px]">
      <li v-for="provider in providers" :key="provider.name">
        <button
          v-if="isProviderVisible(provider)"
          class="group flex w-full items-center gap-4 rounded-[40px] bg-gray-850 px-5 py-[15px] transition-colors"
          :class="
            [
              provider.name === 'MetaMask'
                ? 'hover:bg-[#282125]'
                : 'hover:bg-[#15233C]',
              buttonClass,
            ]
          "
          @click="connect(provider)"
        >
          <div class="flex flex-1 items-center gap-[15px]">
            <ProviderLogo :provider-name="provider.name" />

            <span class="text-[16px]">{{ provider.name }}</span>
          </div>

          <svg
            v-if="loading[provider.name]" :class="
              provider.name === 'MetaMask'
                ? 'text-orange-500'
                : 'text-primary'
            " class="-ml-1 mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          <svg
            v-else class="text-gray-500 transition-all" :class="
              provider.name === 'MetaMask'
                ? 'group-hover:text-orange-500'
                : 'group-hover:text-primary'
            " width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.75 9H14.25" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 3.75L14.25 9L9 14.25" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </li>
    </ul>

    <form class="mt-7 flex flex-col gap-2.5" @submit.prevent="onSubmit">
      <span class="text-sm">Track Portfolio</span>
      <CommonInput v-model="address" name="address" :error-message="errorMessage" placeholder="EOA address" />
      <CommonButton :disabled="!formMeta.valid" :loading="isSubmitting" type="submit" class="mt-2.5 justify-center" size="lg">
        View Read-Only
      </CommonButton>
    </form>
  </div>
</template>
