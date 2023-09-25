<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { getAddress } from 'ethers/lib/utils'
import GasSVG from '~/assets/images/icons/gas.svg?component'
import { Erc20__factory } from '~~/contracts'
import LinkSVG from '~/assets/images/icons/external-link.svg?component'
import type { IToken } from '~/stores/tokens'

const emit = defineEmits(['destroy'])

const { library, account } = useWeb3()
const { sendTransaction, tokenBalances, safeAddress }
  = useAvocadoSafe()
const { authorisedNetworks } = useAuthorities()
const { parseTransactionError } = useErrorHandler()
const { tokens } = storeToRefs(useTokens())
const [isGiftActive, toggleGift] = useToggle(false)
const isDefaultTokenSet = ref(false)

const { gasBalance } = storeToRefs(useSafe())
function computeId(usdc: IToken) {
  return `${usdc.address}-${usdc.name}-${usdc.chainId}`
}

const pendingGasAmount = useNuxtData('pending-deposit')

const usdcTokens = computed(() => {
  return chainUsdcAddresses
    .filter(usdc => usdc.chainId != 250 && authorisedNetworks.value?.some(n => n.chainId == usdc.chainId))
    .map((usdc: any) => {
      const tk = tokens.value.find(
        t =>
          String(t.chainId) === String(usdc.chainId)
          && t.address.toLowerCase() === usdc.address.toLowerCase())

      if (!tk)
        return

      return {
        id: computeId(tk),
        ...tk,
        name: `${tk.name} (${chainIdToName(usdc.chainId)})`,
        balance: getUSDCBalance(usdc.chainId, usdc.address)?.balance,
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => toBN(b.balance).minus(a.balance).toNumber())
})

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required('')
      .test('min-amount', '', (value, { createError }) => {
        const amount = toBN(value!)
        const minAmount = String(token.value?.chainId) == '1' ? '5' : '0.01'

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
    id: yup.string().required(),
  }),
})

const { value: amount, meta: amountMeta } = useField<string>('amount')
const { value: id, setValue } = useField<string>(
  'id',
)

// TODO:
const token = computed(() => usdcTokens.value.find((tk: any) => tk.id === id.value))
function getToken(tokenId: string) {
  return usdcTokens.value.find((tk: any) => tk.id === tokenId)
}

function getUSDCBalance(chainId: string | number, usdcAddr: string) {
  return tokenBalances.value.find(
    t =>
      t.chainId == chainId
      && getAddress(t.address) === getAddress(usdcAddr),
  )!
}

function setMax() {
  if (!token.value)
    return
  amount.value = token.value.balance
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
        chainId: token.value.chainId,
      },
      {
        metadata,
      },
      'topup',
    )

    setTimeout(() => {
      refreshNuxtData('pending-deposit')
    }, 1000)

    if (!transactionHash)
      return

    logActionToSlack({
      action: 'topup',
      message: generateSlackMessage(metadata, token.value.chainId),
      account: account.value,
      chainId: String(token.value.chainId),
      txHash: transactionHash,
      amountInUsd: amount.value,
    })

    emit('destroy')

    showPendingTransactionModal(transactionHash, token.value.chainId, 'topUpGas')

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

watch(usdcTokens, () => {
  if (usdcTokens.value?.length > 0 && !isDefaultTokenSet.value) {
    const mostBalancedChain = usdcTokens.value[0]?.id

    if (mostBalancedChain) {
      setValue(mostBalancedChain)
      isDefaultTokenSet.value = true
    }
  }
}, {
  immediate: true,
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
          v-model="id"
          label-key="name"
          value-key="id"
          item-wrapper-classes="!items-baseline"
          :options="usdcTokens"
        >
          <template #button-prefix>
            <ChainLogo v-if="token" class="w-6 h-6" :chain="token.chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo v-if="getToken(value)" class="w-6 h-6 flex-shrink-0" :chain="getToken(value).chainId" />
          </template>
          <template #item="{ label, item }">
            <div class="flex flex-col gap-1 mb-auto text-sm sm:text-base">
              <span class="text-sm">{{ label }}</span>
              <span class="text-sm text-gray-400 font-medium">
                {{ formatDecimal(item.balance) }} {{ item.symbol.toUpperCase() }}
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
          <SvgSpinner v-if="!usdcTokens?.length" class="text-primary" />
          <span v-else class="uppercase">{{ formatDecimal(token?.balance || 0) }} {{ token?.symbol }}</span>
        </div>
        <CommonInput
          v-model="amount"
          type="numeric"
          :error-message="amountMeta.dirty ? errors.amount : ''"
          name="amount"
          placeholder="Enter amount"
          autofocus
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
      Deposited gas cannot be withdrawn at this time. Please only top up what you plan to use.
    </p>
  </div>
</template>
