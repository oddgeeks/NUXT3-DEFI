import { useForm } from 'vee-validate'
import * as yup from 'yup'
import Fuse from 'fuse.js'
import { getAddress, isAddress } from '@ethersproject/address'
import type { IBalance } from '~/stores/safe'
import StepFrom from '~~/components/modals/Send/StepFrom.vue'
import StepSubmit from '~~/components/modals/Send/StepSubmit.vue'

interface Initialize {
  fromChainId: number
  address?: string
  contact?: IContact
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

const data = ref<ISendData>(defaultValues())
const actualAddress = ref('')

export function useSend(initialSendData?: ISendData) {
  const { tokens } = storeToRefs(useTokens())

  const steps = [
    {
      name: 'From',
      component: StepFrom,
    },
    {
      name: 'Send',
      component: StepSubmit,
    },
  ]

  const { tokenBalances } = storeToRefs(useSafe())
  const { getRpcProviderByChainId } = useShared()
  const { checkNetworkIsAuthorised } = useAuthorities()

  const availableTokens = computed(() =>
    tokenBalances.value.filter(
      t =>
        gt(t.balance, '0') && checkNetworkIsAuthorised(t.chainId),
    ),
  )

  const token = computed(() => {
    return tokenBalances.value.find(token =>
      String(token.chainId) == String(data.value.fromChainId)
      && token.address.toLowerCase() == data.value.tokenAddress.toLowerCase())
  })

  const targetToken = computed(() => {
    return toTokenList.value ? toTokenList.value[0] : null
  })

  const { data: toTokenList, pending: tokenlistPending } = useAsyncData(async () => {
    if (data.value.fromChainId == data.value.toChainId)
      return []

    const { result }: IBridgeTokensResponse = await http(
      '/api/socket/v2/token-lists/to-token-list',
      {
        params: {
          fromChainId: data.value.fromChainId,
          toChainId: data.value.toChainId,
          isShortList: true,
        },
      },
    )

    return filterAndSortTokens(result, token.value?.symbol!)
  }, {
    watch: [() => data.value.toChainId],
  })

  const isCrossChain = computed(() => String(data.value.fromChainId) !== String(data.value.toChainId))

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

          actualAddress.value = ''

          const resolvedAddress
            = value.endsWith('.eth') && data.value.toChainId === 1
              ? await getRpcProviderByChainId(1).resolveName(value)
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
    const firstToken = tokenBalances.value.find(t => String(t.chainId) === String(params.fromChainId))
    const firstBalancedToken = tokenBalances.value.find(t => String(t.chainId) === String(params.fromChainId) && gt(t.balance, '0'))

    const actualTokenAddress = params.address ?? firstBalancedToken?.address ?? firstToken?.address

    if (!actualTokenAddress) {
      console.error('No tokens found')
      return
    }

    if (initialSendData) {
      data.value = JSON.parse(JSON.stringify(initialSendData))
      return
    }

    data.value.fromChainId = params.fromChainId
    data.value.toChainId = params.fromChainId
    data.value.tokenAddress = actualTokenAddress

    if (params.contact)
      data.value.address = params.contact.address
  }

  const reset = () => {
    data.value = defaultValues()
    activeStep.value = 0
    actualAddress.value = ''
  }

  const stepBack = () => {
    activeStep.value = Math.max(0, activeStep.value - 1)
  }

  const stepForward = () => {
    activeStep.value = Math.min(steps.length - 1, activeStep.value + 1)
  }

  function filterAndSortTokens(list: IBridgeTokensResult[] | IBalance[] | any[], search: string) {
    const fuse = new Fuse(list, {
      keys: ['symbol', 'name'],
      threshold: 0.4,
      shouldSort: true,
      includeScore: true,
    })

    const sortedByMatch = fuse.search(search)

    const items = sortedByMatch.map(i => i.item)

    console.log(items)

    return items.filter((i) => {
      const token = tokens.value.find(
        t =>
          getAddress(t.address) === getAddress(i.address)
            && String(t.chainId) == String(i.chainId),
      )

      return !!token
    })
  }

  return {
    data,
    activeStep,
    isCrossChain,
    stepBack,
    stepForward,
    steps,
    initialize,
    reset,
    token,
    targetToken,
    availableTokens,
    tokenlistPending,
    actualAddress,
  }
}
