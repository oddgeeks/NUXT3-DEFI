<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { getAddress } from 'ethers/lib/utils'
import GasSVG from '~/assets/images/icons/gas.svg?component'
import { Erc20__factory } from '~~/contracts'
import LinkSVG from '~/assets/images/icons/external-link.svg?component'

const emit = defineEmits(['destroy'])

const { library, account } = useWeb3()
const { sendTransaction, tokenBalances, safeAddress }
  = useAvocadoSafe()
const { authorisedNetworks } = useAuthorities()
const { parseTransactionError } = useErrorHandler()
const [isGiftActive, toggleGift] = useToggle(false)

const { gasBalance } = storeToRefs(useSafe())

const pendingGasAmount = useNuxtData('pending-deposit')

const networks = computed(() => {
  return authorisedNetworks.value?.map(network => ({
    ...network,
    balance: getUSDCByChainId(network.chainId)?.balance,
  }))
    .sort((a, b) => toBN(b.balance).minus(a.balance).toNumber())
})

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required('')
      .test('min-amount', '', (value, { createError }) => {
        const amount = toBN(value)
        const minAmount = String(chainId.value) == '1' ? '5' : '0.01'

        return amount.gt(minAmount) || !value
          ? true
          : createError({
            path: 'amount',
            message: `Amount must be greater than ${minAmount} USDC`,
          })
      })
      .test('max-amount', 'Insufficient balance', (value: any) => {
        const amount = toBN(value)
        const balance = toBN(token.value?.balance || 0)

        return amount.gt(0) ? amount.lte(balance) : true
      }),
    chainId: yup.number().integer().required(),
  }),
})

const { value: amount, meta: amountMeta } = useField<string>('amount')
const { value: chainId, setValue } = useField<number>(
  'chainId',
  {},
  { initialValue: 137 },
)

// TODO:
const token = computed(() => getUSDCByChainId(String(chainId.value)))

function getUSDCByChainId(chainId: string | number) {
  const usdcAddr = availableNetworks.find(i => String(i.chainId) == chainId)
    ?.usdcAddress as string

  return tokenBalances.value.find(
    t =>
      t.chainId == chainId
      && getAddress(t.address) === getAddress(usdcAddr),
  )!
}

function setMax() {
  amount.value = token.value!.balance
}

const loading = ref(false)
const sendingDisabled = computed(
  () => !token.value || !account.value || loading.value || !meta.value.valid,
)

const onSubmit = handleSubmit(async () => {
  if (!token.value)
    return

  loading.value = false

  if (sendingDisabled.value)
    return

  loading.value = true
  try {
    const transferAmount = toBN(amount.value)
      .times(10 ** token.value.decimals)
      .toFixed(0)

    const tx = {
      from: account.value,
      to: avoDepositAddress,
      value: '0',
      data: '0x',
    }

    if (token.value.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      tx.value = transferAmount
    }
    else {
      const contract = Erc20__factory.connect(
        token.value.address,
        library.value,
      )

      const { data } = await contract.populateTransaction.transfer(
        avoDepositAddress,
        transferAmount,
      )

      tx.data = data!
      tx.to = token.value.address
    }

    const metadata = encodeTopupMetadata({
      amount: transferAmount,
      token: token.value.address,
      onBehalf: safeAddress.value,
    })

    const transactionHash = await sendTransaction(
      {
        ...tx,
        chainId: chainId.value,
      },
      {
        metadata,
      },
    )

    logActionToSlack({
      action: 'topup',
      message: `${amount.value} ${formatSymbol('usdc')}`,
      account: account.value,
      chainId: String(chainId.value),
      txHash: transactionHash,
      amountInUsd: amount.value,
    })

    emit('destroy')

    showPendingTransactionModal(transactionHash, chainId.value, 'topUpGas')

    resetForm()
  }
  catch (e: any) {
    console.log(e)

    const err = parseTransactionError(e)
    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      type: 'error',
      action: 'topup',
      account: account.value,
      errorDetails: err.parsed,
    })
  }

  loading.value = false
})

onMounted(() => {
  const mostBalancedChain = networks.value ? networks.value[0]?.chainId : null
  if (mostBalancedChain)
    setValue(Number(mostBalancedChain))
})
</script>

<template>
  <div class="space-y-7.5 text-center">
    <div
      class="flex items-center mx-auto justify-center h-10 w-10 rounded-full dark:bg-slate-800 bg-slate-100"
    >
      <GasSVG class="text-slate-900 dark:text-white" />
    </div>
    <div class="flex gap-4 flex-col">
      <h1 class="text-lg leading-5">
        Gas Reserve
      </h1>
      <h2 class="text-xs text-slate-400 leading-5 font-medium">
        You will be able to use this as gas on any supported chain. Note that
        you need to have USDC in your Avocado wallet to add gas.
      </h2>
      <a
        href="https://help.avocado.instadapp.io/en/articles/7038872-topping-up-gas-on-avocado"
        target="blank"
        rel="noopener noreferrer"
        class="text-sm text-center justify-center font-medium inline-flex gap-2.5 text-primary"
      >
        What’s happening here?
        <LinkSVG />
      </a>
    </div>
    <span
      class="whitespace-nowrap block px-5 py-3 ring-2 dark:ring-slate-700 ring-slate-200 rounded-[30px] w-fit leading-5 mx-auto"
    >
      {{ formatDecimal(gasBalance, 2) }} USDC
    </span>
    <div
      v-if="toBN(pendingGasAmount.data.value).gt('0')"
      class="flex-col leading-5 text-xs gap-0.5 text-orange-400 items-center justify-center flex"
    >
      <div class="flex items-center gap-2">
        <SvgSpinner />
        {{ formatUsd(pendingGasAmount.data.value) }}
        gas is pending block confirmation
      </div>
      <NuxtLink
        href="https://help.avocado.instadapp.io/en/articles/7211493-why-haven-t-my-gas-credits-reflected-yet"
        target="blank"
        external
        rel="noopener noreferrer"
        class="text-xs font-medium text-primary"
      >
        Learn More
      </NuxtLink>
    </div>
    <form v-if="!isGiftActive" class="space-y-5" @submit="onSubmit">
      <div class="flex flex-col gap-2.5">
        <span class="text-left leading-5 text-sm sm:text-base">Network</span>
        <CommonSelect
          v-model="chainId"
          label-key="name"
          value-key="chainId"
          item-wrapper-classes="!items-baseline"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
          <template #item="{ label, item }">
            <div class="flex flex-col gap-1 mb-auto text-sm sm:text-base">
              <span>{{ label }}</span>
              <span class="text-sm text-gray-400 font-medium">
                {{ formatDecimal(item.balance) }} USDC
              </span>
            </div>
          </template>
        </CommonSelect>
      </div>

      <div class="space-y-2.5">
        <div
          class="flex justify-between items-center leading-5 text-sm sm:text-base"
        >
          <span>Amount</span>
          <span class="uppercase">{{ formatDecimal(token?.balance) }} {{ token?.symbol }}</span>
        </div>
        <CommonInput
          v-model="amount"
          type="numeric"
          :error-message="amountMeta.dirty ? errors.amount : ''"
          name="amount"
          placeholder="Enter amount"
        >
          <template #suffix>
            <button
              type="button"
              class="absolute top-0 bottom-0 right-0 mr-5 text-sm text-primary hover:text-primary"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
      </div>
      <CommonButton
        type="submit"
        :disabled="sendingDisabled"
        :loading="loading"
        class="justify-center w-full"
        size="lg"
      >
        Add Gas
      </CommonButton>
    </form>

    <FormsGiftCode v-else @close="toggleGift()" />

    <button
      v-if="!isGiftActive"
      type="button"
      class="text-xs text-primary !mt-3"
      @click="toggleGift()"
    >
      Redeem Code
    </button>
    <p class="w-full text-xs text-orange-400 leading-5">
      Deposited gas cannot be withdrawn at this time. Withdrawals will be
      enabled in a future update.
    </p>
  </div>
</template>
