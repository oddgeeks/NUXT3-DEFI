<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { ethers } from 'ethers'
import { storeToRefs } from 'pinia'
import { wait } from '@instadapp/utils'
import SVGX from '~/assets/images/icons/x.svg?component'

const emit = defineEmits(['close'])
const { parseTransactionError } = useErrorHandler()
const { account, provider } = useWeb3()
const { setGasBalance, avoProvider } = useSafe()
const { safeAddress, gasBalance } = storeToRefs(useSafe())
const {
  handleSubmit,
  isSubmitting,
  meta: formMeta,
  errors,
} = useForm({
  validationSchema: yup.object({
    'gift-code': yup.string().required(''),
  }),
})

const { value, meta: valueMeta, setErrors } = useField<string>('gift-code')

const sendingDisabled = computed(
  () => !account.value || !formMeta.value.valid || isSubmitting.value,
)

const onSubmit = handleSubmit(async () => {
  const browserProvider = new ethers.providers.Web3Provider(provider.value)

  const signer = browserProvider.getSigner()

  let message = `Avocado wants you to sign in with your web3 account ${
    account.value
  }

Action: Redeem code
Code: ${value.value}
URI: https://avocado.instadapp.io
Nonce: {{NONCE}}
AvoAddress: {{SAFE}}
Issued At: ${new Date().toISOString()}`

  try {
    const oldGasBalance = gasBalance.value
    const nonce = await avoProvider.send('api_generateNonce', [
      account.value,
      safeAddress.value,
      message,
    ])

    message = message.replaceAll('{{NONCE}}', nonce)
    message = message.replaceAll('{{SAFE}}', safeAddress.value)

    const redeemSignature = await signer.signMessage(
      message,
    )

    const success = await avoProvider.send('api_claimGift', [
      value.value,
      redeemSignature,
      nonce,
    ])

    if (!success) {
      setErrors('Invalid redeem code.')

      // logActionToSlack({
      //   message: `Invalid redeem code. (${value.value})`,
      //   type: "error",
      //   action: "reedem",
      //   account: account.value,
      // });
    }
    else {
      logActionToSlack({
        message: `(${value.value})`,
        action: 'reedem',
        account: account.value,
      })

      await wait(3000)

      await setGasBalance()

      const giftedAmount = toBN(gasBalance.value).minus(oldGasBalance).toFixed()

      openSnackbar({
        message: `${formatUsd(giftedAmount)} Gas redeemed successfully!`,
        type: 'success',
        timeout: 3000,
      })

      emit('close')
    }
  }
  catch (e: any) {
    const err = parseTransactionError(e)
    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      type: 'error',
      action: 'reedem',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
})
</script>

<template>
  <form class="flex flex-col gap-7.5" @submit="onSubmit">
    <label for="input-gift-code">
      <div class="mb-2.5 flex justify-between">
        <span class="text-sm">Reedem code</span>
        <button
          type="button"
          class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900"
          aria-label="Gift Code"
          @click="$emit('close')"
        >
          <SVGX class="h-2.5 w-2.5" />
        </button>
      </div>
      <CommonInput
        v-model.trim="value"
        :error-message="valueMeta.dirty ? errors['gift-code'] : ''"
        autofocus
        placeholder="Enter Gift Code"
        name="gift-code"
      />
    </label>
    <CommonButton
      :disabled="sendingDisabled"
      :loading="isSubmitting"
      type="submit"
      class="w-full justify-center"
      size="lg"
    >
      Redeem Gas
    </CommonButton>
  </form>
</template>
