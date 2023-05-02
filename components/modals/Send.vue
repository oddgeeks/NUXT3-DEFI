<script setup lang="ts">
import { useField, useFieldArray, useForm } from 'vee-validate'
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { Erc20__factory } from '~~/contracts'
import ContactSVG from '~/assets/images/icons/contact.svg'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg'
import PlusSVG from '~/assets/images/icons/plus.svg'

const props = defineProps({
  chainId: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  contact: {
    type: Object as PropType<IContact>,
    required: false,
  },
})
const emit = defineEmits(['destroy'])
const { toWei } = useBignumber()

const { library, account } = useWeb3()
const { safeAddress, sendTransactions, tokenBalances, safe, isSafeAddress }
  = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()

const contact = ref<IContact | undefined>(props.contact)

const tochainId = ref<string>(props.chainId || '1')

const availableTokens = computed(() =>
  tokenBalances.value.filter(t => t.chainId == tochainId.value),
)

const tokens = ref([
  props.address
    ? tokenBalances.value.find(
      t => t.chainId == tochainId.value && t.address === props.address,
    )!
    : availableTokens.value.find(
      _token =>
        _token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    )!,
])

watch(
  () => tochainId.value,
  () => {
    if (availableTokens.value.length > 0) {
      tokens.value = [
        availableTokens.value.find(
          _token =>
            _token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ) ?? availableTokens.value[0],
      ]
      for (let i = 1; i < amounts.value.length; i += 1)
        removeAmount(1)

      amounts.value[0].value = ''
    }
  },
)

const networks = availableNetworks.map((network) => {
  return {
    ...network,
    chainId: network.chainId.toString(),
  }
})

const actualAddress = ref('')

const { handleSubmit, errors, meta, resetForm, validate, isSubmitting }
  = useForm({
    validationSchema: yup.object({
      amounts: yup
        .array(
          yup
            .string()
            .required('')
            .test('min-amount', '', (value) => {
              const amount = toBN(value)

              return value ? amount.gt(0) : true
            }),
        )
        .test('max-amount', 'Insufficient balance', (value) => {
          for (let i = 0; i < value.length; i += 1) {
            const amount = toBN(value[i])
            const balance = toBN(tokens.value[i].balance)
            if (amount.gt(balance))
              return false
          }
          return true
        }),
      address: yup
        .string()
        .required('')
        .test('is-address', 'Incorrect address', async (value) => {
          if (!value)
            return true

          const resolvedAddress
            = value.endsWith('.eth') && tochainId.value == '1'
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
    initialValues: {
      amounts: [''],
    },
  })

const {
  remove: removeAmount,
  push: pushAmount,
  update: updateAmount,
  fields: amounts,
} = useFieldArray<string>('amounts')
const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
} = useField<string>('address', undefined, {
  initialValue: contact.value ? contact.value.address : '',
})

function amountInUsd(idx: number) {
  if (!tokens.value[idx])
    return '0'
  return toBN(tokens.value[idx].price || 0)
    .times(amounts.value[idx].value || '0')
    .toFixed()
}

function setMax(idx: number) {
  updateAmount(
    idx,
    toBN(tokens.value[idx].balance).decimalPlaces(6, 1).toString(),
  )
}

const sendingDisabled = computed(
  () =>
    tokens.value.length === 0
    || isSubmitting.value
    || !meta.value.valid
    || pending.value
    || !!error.value,
)

const { data: txs } = useAsyncData(
  async () => {
    const { valid } = await validate()
    if (!valid)
      return

    const txs = []

    for (let i = 0; i < tokens.value.length; i += 1) {
      const token = tokens.value[i]
      const amount = amounts.value[i]

      const transferAmount = toBN(amount.value)
        .times(10 ** token.decimals)
        .toFixed(0)

      if (token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        txs.push({
          from: account.value,
          to: actualAddress.value,
          value: transferAmount,
          data: '0x',
        })
      }
      else {
        const contract = Erc20__factory.connect(token.address, library.value)

        const { data } = await contract.populateTransaction.transfer(
          actualAddress.value,
          transferAmount,
        )

        txs.push({
          from: account.value,
          to: token.address,
          value: '0',
          data: data!,
        })
      }
    }

    return txs
  },
  {
    watch: [amounts.value, address, tokens.value],
  },
)

const { data: totalTransfers } = useAsyncData(
  async () => {
    if (!isAddress(actualAddress.value))
      return

    const toSafeAddress = await isSafeAddress(actualAddress.value)

    const res = await http('/api/transfers', {
      params: {
        from: safeAddress.value,
        to: [actualAddress.value],
        chainIds: [toSafeAddress ? 0 : tochainId.value],
      },
    })

    return res[0].transferCount
  },
  {
    watch: [actualAddress, tochainId],
  },
)

const { data, pending, error } = useEstimatedFee(txs, tochainId)

const onSubmit = handleSubmit(async () => {
  try {
    // encodeMultipleActions
    const metadatas = tokens.value.map((token, idx) =>
      encodeTransferMetadata(
        {
          token: token.address,
          amount: toWei(amounts.value[idx].value, token.decimals),
          receiver: actualAddress.value,
        },
        false,
      ),
    )
    const metadata = encodeMultipleActions(...metadatas)

    const transactionHash = await sendTransactions(
      txs.value!,
      Number(tochainId.value),
      {
        metadata,
      },
    )

    console.log(transactionHash)

    let message = ''
    for (let i = 0; i < tokens.value.length; i += 1) {
      message += `${formatDecimal(amounts.value[i].value)} ${formatSymbol(
        tokens.value[i].symbol,
      )}`

      if (i < tokens.value.length - 1)
        message += ', '
    }
    logActionToSlack({
      message: `${message} to ${actualAddress.value}`,
      action: 'send',
      txHash: transactionHash,
      chainId: tochainId.value,
      account: account.value,
    })

    resetForm()
    emit('destroy')

    showPendingTransactionModal(transactionHash, tochainId.value, 'send')
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'send',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
})

async function handleEdit() {
  if (!contact.value)
    return

  const result = await openAddContactModal(
    contact.value.name,
    contact.value.address,
    contact.value.chainId,
    true,
  )

  if (result.success) {
    contact.value = result.payload as IContact

    if (contact.value.chainId && tochainId.value !== contact.value.chainId)
      tochainId.value = contact.value.chainId

    setAddress(contact.value.address)
  }
}

async function handleSelectContact() {
  const result = await openSelectContactModal()

  if (result.success) {
    const _contact = result.payload as IContact

    if (!!_contact.chainId && tochainId.value !== _contact.chainId)
      tochainId.value = _contact.chainId

    setAddress(_contact.address)
  }
}

function handleAddMore() {
  pushAmount('')
  const newToken = getAvailableTokens()[0]
  if (newToken)
    tokens.value.push(newToken)
}

function deleteToken(idx: number) {
  removeAmount(idx)
  tokens.value.splice(idx, 1)
}

function getAvailableTokens(idx?: number) {
  const tokensToRemove = (
    idx === undefined
      ? tokens.value
      : tokens.value.filter((_, index) => index !== idx)
  ).map(token => token.address)

  return availableTokens.value.filter(
    token => !tokensToRemove.includes(token.address),
  )
}

function isInsufficient(idx: number) {
  const amount = toBN(amounts.value[idx].value)
  const balance = toBN(tokens.value[idx].balance)
  return amount.gt(balance)
}
</script>

<template>
  <form class="text-center flex gap-7.5 flex-col" @submit="onSubmit">
    <div
      class="flex flex-col justify-center gap-[15px] items-center"
      :class="{
        'border-b-[1px] dark:border-b-slate-800 border-b-slate-100 -mx-[50px] px-[50px] pb-7.5':
          contact,
      }"
    >
      <h2>{{ contact ? `Send to ${contact.name}` : "Send" }}</h2>

      <CommonSelect
        v-if="!contact?.chainId"
        v-model="tochainId"
        value-key="chainId"
        label-key="name"
        icon-key="icon"
        class="mt-[5px]"
        :options="networks"
      >
        <template #button-prefix>
          <ChainLogo class="w-6 h-6" :chain="tochainId" />
        </template>
        <template #item-prefix="{ value }">
          <ChainLogo class="w-6 h-6" :chain="value" />
        </template>
      </CommonSelect>
      <div
        v-if="contact"
        class="flex items-center rounded-5 mt-[15px] pl-5 pr-4 py-5 dark:bg-gray-850 bg-slate-50 justify-between w-full"
      >
        <div class="flex items-center gap-3">
          <ChainLogo :stroke="false" class="w-7 h-7" :chain="contact.chainId" />
          <Copy :text="contact.address">
            <template #content>
              <span class="dark:text-white text-slate-900">{{
                shortenHash(contact.address)
              }}</span>
            </template>
          </Copy>
        </div>
        <CommonButton
          :disabled="contact.owner"
          color="white"
          class="justify-center dark:bg-slate-800 bg-slate-150 !px-4"
          @click="handleEdit()"
        >
          Edit
        </CommonButton>
      </div>
    </div>
    <div
      class="flex flex-col gap-3.5 scroll-style sm:max-h-[378px] sm:overflow-y-auto"
    >
      <div
        v-for="(token, idx) of tokens"
        :key="idx"
        class="flex flex-col sm:flex-row gap-5 rounded-5 dark:bg-gray-850 bg-slate-50 px-5 py-4"
      >
        <div class="gap-y-2.5 flex flex-col">
          <div class="flex items-center justify-between">
            <span class="text-sm">Coin</span>
            <button
              v-if="amounts.length > 1"
              class="sm:hidden"
              type="button"
              @click="deleteToken(idx)"
            >
              <PlusSVG class="text-slate-400 rotate-45 w-3.5 h-3.5" />
            </button>
          </div>
          <TokenSelection
            v-model="tokens[idx]"
            class="relative w-full flex items-center gap-2.5 max-h-12 rounded-2xl border-2 dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
            :tokens="getAvailableTokens(idx)"
          />
        </div>
        <!-- end token select -->
        <div class="gap-y-2.5 flex flex-col flex-1">
          <div class="flex items-center justify-between">
            <span class="text-sm">Amount</span>
            <div class="flex text-sm uppercase gap-x-3">
              <span>
                {{ formatDecimal(tokens[idx].balance) }}
                {{ tokens[idx].symbol }}
              </span>
              <button
                type="button"
                class="text-primary hover:text-primary"
                @click="setMax(idx)"
              >
                MAX
              </button>
              <button
                v-if="amounts.length > 1"
                class="hidden sm:flex"
                type="button"
                @click="deleteToken(idx)"
              >
                <PlusSVG class="text-slate-400 rotate-45 w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <CommonInput
            v-model="amounts[idx].value"
            type="numeric"
            :error-message="isInsufficient(idx) ? 'Insufficient balance' : ''"
            :name="`amounts[${idx}]`"
            placeholder="Enter amount"
          >
            <template #suffix>
              <span class="text-sm font-semibold text-left text-slate-400">
                {{ formatUsd(amountInUsd(idx)) }}</span>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>
    <div class="flex -mt-4">
      <CommonButton
        :disabled="getAvailableTokens().length === 0"
        color="white"
        size="sm"
        class="items-center gap-2.5 h-9 !px-2.5"
        @click="handleAddMore()"
      >
        <div
          class="rounded-full bg-primary p-1.5 text-white"
          :class="{
            'dark:bg-slate-600 bg-slate-300 dark:!text-slate-500 !text-slate-400':
              getAvailableTokens().length === 0,
          }"
        >
          <PlusSVG class="w-2 h-2" />
        </div>
        Add More
      </CommonButton>
    </div>
    <div class="space-y-5">
      <div v-if="!contact" class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-sm">Address</span>
          <span v-if="totalTransfers" class="text-sm text-slate-400">
            {{ totalTransfers }} previous
            {{ totalTransfers === 1 ? "send" : "sends" }}
          </span>
          <span
            v-else-if="totalTransfers === 0"
            class="text-sm text-orange-400 flex items-center gap-2"
          >
            <SVGInfoCircle
              v-tippy="
                'You are sending tokens to this address for the first time, make sure to double check the address again'
              "
            /> New Address Detected
          </span>
        </div>

        <CommonInput
          v-model="address"
          :error-message="addressMeta.dirty ? errors.address : ''"
          name="address"
          placeholder="Enter Address"
        >
          <template #suffix>
            <button
              v-tippy="{
                content: 'Select contact',
                trigger: 'mouseenter',
              }"
              type="button"
              class="ml-3"
              @click="handleSelectContact()"
            >
              <ContactSVG class="text-slate-400" />
            </button>
          </template>
        </CommonInput>
      </div>

      <div
        v-if="contact"
        class="dark:bg-gray-850 !mt-5 bg-slate-50 px-3 py-2 flex space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="tochainId" />
        <span class="text-xs font-medium leading-5">
          Sending on the {{ chainIdToName(tochainId) }} network
        </span>
      </div>

      <EstimatedFee
        :chain-id="tochainId"
        :loading="pending"
        :data="data"
        :error="error"
      />
    </div>

    <CommonButton
      type="submit"
      :disabled="sendingDisabled"
      :loading="isSubmitting || pending"
      class="justify-center w-full"
      size="lg"
    >
      Send
    </CommonButton>
  </form>
</template>
