import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import StepFrom from '~~/components/modals/Send/StepFrom.vue'
import StepTo from '~~/components/modals/Send/StepTo.vue'
import StepSubmit from '~~/components/modals/Send/StepSubmit.vue'

interface Initialize {
  fromChainId: number
  tokenAddress: string
}

function defaultValues() {
  return {
    fromChainId: 1,
    toChainId: 137,
    tokenAddress: '',
    address: '',
    amount: '0',
  }
}

const activeStep = ref(0)

const data = ref(defaultValues())

export function useSend() {
  const steps = [
    {
      name: 'From',
      component: StepFrom,
    },
    {
      name: 'To',
      component: StepTo,
    },
    {
      name: 'Send',
      component: StepSubmit,
    },
  ]

  const { tokenBalances } = storeToRefs(useSafe())

  const actualAddress = ref('')

  const availableTokens = computed(() =>
    tokenBalances.value.filter(
      t =>
        +t.chainId == data.value.fromChainId && t.address.toLowerCase() !== data.value.tokenAddress.toLowerCase(),
    ),
  )

  const token = computed(() => {
    const selam = tokenBalances.value.find(token =>
      +token.chainId == data.value.fromChainId
      && token.address.toLowerCase() === data.value.tokenAddress.toLowerCase())

    return selam
  })

  useForm({
    validationSchema: yup.object({
      amount:
          yup
            .string()
            .required('')
            .test('min-amount', '', (value: any) => {
              const amount = toBN(value)

              return value ? amount.gt(0) : true
            })
            .test('max-amount', 'Insufficient balance', (value: any) => {
              const amount = toBN(value)
              const balance = toBN(token.value?.balance || '0')

              console.log(amount.toFixed(), balance.toFixed())
              if (amount.gt(balance))
                return false

              return true
            }),
      address: yup
        .string()
        .required('')
        .test('is-address', 'Incorrect address', async (value) => {
          if (!value)
            return true

          const resolvedAddress
            = value.endsWith('.eth') && data.value.toChainId === 1
              ? await getRpcProvider(1).resolveName(value)
              : null

          if (resolvedAddress) {
            actualAddress.value = resolvedAddress
            return true
          }

          if (isAddress(value)) {
            actualAddress.value = value
            return true
          }

          actualAddress.value = ''

          return false
        }),
    }),
  })

  const initialize = (params: Initialize) => {
    data.value.fromChainId = params.fromChainId
    data.value.toChainId = params.fromChainId
    data.value.tokenAddress = params.tokenAddress
  }

  const reset = () => {
    data.value = defaultValues()
    activeStep.value = 0
  }

  const stepBack = () => {
    activeStep.value = Math.max(0, activeStep.value - 1)
  }

  const stepForward = () => {
    activeStep.value = Math.min(steps.length - 1, activeStep.value + 1)
  }

  watch(
    () => data.value.fromChainId,
    () => {
      const firstBalancedToken = availableTokens.value.find(t => toBN(t.balance).gt('0') || !!t.balance)

      data.value.tokenAddress = firstBalancedToken?.address || ''
    },
  )

  return {
    data,
    activeStep,
    stepBack,
    stepForward,
    steps,
    initialize,
    reset,
    token,
    availableTokens,
  }
}
