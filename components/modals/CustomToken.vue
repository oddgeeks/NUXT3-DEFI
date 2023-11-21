<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import ClipboardSVG from '~/assets/images/icons/clipboard.svg?component'
import type { IBalance } from '~/stores/safe'
import { Erc20__factory } from '~~/contracts'

const props = defineProps<{
  address: string
}>()

const { handleAddToken, fetchTokenByAddress } = useTokens()
const { tokens } = storeToRefs(useTokens())
const { getRpcProviderByChainId } = useShared()
const { safeAddress } = storeToRefs(useSafe())
const { fetchBalances } = useSafe()

const { handleSubmit, isSubmitting, errors, meta, resetForm, validate }
  = useForm({
    validationSchema: yup.object({
      chainId: yup.string().required(''),
      address: yup
        .string()
        .required('')
        .test('is-valid-address', 'Incorrect address', (value) => {
          return value ? isAddress(value || '') : true
        })
        .test(
          'duplicate-address',
          'Token already added',
          (value, { parent }) => {
            if (!isAddress(value || ''))
              return true

            return !tokens.value.some((t) => {
              return (
                t.address.toLowerCase() === value?.toLowerCase()
                && t.chainId == parent.chainId
              )
            })
          },
        ),
    }),
  })

const { value: chainId } = useField<string>('chainId', undefined, {
  initialValue: '1',
})
const {
  value: reactiveAddress,
  meta: addressMeta,
  setValue,
} = useField<string>('address')

const {
  data: token,
  pending,
  error,
} = useAsyncData(
  `custom-token-${props.address}`,
  async () => {
    const { valid } = await validate()

    if (valid) {
      const contract = Erc20__factory.connect(
        reactiveAddress.value,
        getRpcProviderByChainId(chainId.value),
      )

      const symbol = await contract.symbol()
      const name = await contract.name()
      const decimals = await contract.decimals()

      const tokens = await fetchTokenByAddress([reactiveAddress.value], chainId.value) || []

      const token = tokens[0]

      const balance = await contract.balanceOf(safeAddress.value)

      const balanceFormatted = fromWei(toBN(balance), decimals).toFixed(2)

      const sparkline = token?.sparkline_price_7d || []

      const price = toBN(token?.price || '0').eq('0') && sparkline.length > 0
        ? sparkline[sparkline.length - 1]
        : token?.price

      return {
        address: reactiveAddress.value,
        chainId: chainId.value,
        symbol,
        name,
        decimals,
        coingeckoId: token.coingecko_id || '',
        logoURI: token?.logo_url || '',
        price,
        sparklinePrice7d: sparkline,
        balance: balanceFormatted,
      } as IBalance
    }
  },
  {
    watch: [reactiveAddress, chainId],
  },
)

const loading = computed(
  () => (isSubmitting.value || pending.value) && meta.value.valid,
)

const disabled = computed(
  () => !meta.value.valid || isSubmitting.value || !token.value || pending.value,
)

const onSubmit = handleSubmit(async () => {
  if (!token.value)
    return

  await handleAddToken(token.value)

  fetchBalances()

  openSnackbar({
    message: `${token.value?.name} added successfully.`,
    type: 'success',
    timeout: 5000,
  })

  refreshNuxtData('custom-tokens')
  resetForm({
    values: {
      chainId: '1',
      address: '',
    },
  })
})

async function pasteAddress() {
  try {
    reactiveAddress.value = await navigator.clipboard.readText()
  }
  catch (e) {
    console.log(e)
    openSnackbar({
      message: 'Please allow clipboard access',
      type: 'error',
    })
  }
}

onMounted(() => {
  if (props.address)
    setValue(props.address)
})

onUnmounted(() => {
  clearNuxtData(`custom-token-${props.address}`)
})
</script>

<template>
  <form @submit="onSubmit">
    <h1 class="mb-7.5 text-center text-lg leading-5">
      Custom Token
    </h1>
    <div class="mb-7.5 flex flex-col gap-5">
      <div>
        <p class="mb-2.5 text-sm">
          Network
        </p>
        <CommonSelect
          v-model="chainId"
          class="w-full"
          value-key="chainId"
          label-key="name"
          :options="availableNetworks"
        >
          <template #button-prefix>
            <ChainLogo class="h-6 w-6 shrink-0" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="h-6 w-6 shrink-0" :chain="value" />
          </template>
        </CommonSelect>
      </div>
      <div>
        <p class="mb-2.5 text-sm">
          Token Address
        </p>
        <CommonInput
          v-model.trim="reactiveAddress"
          autofocus
          :error-message="addressMeta.dirty ? errors.address : ''"
          name="address"
          placeholder="Enter Address"
        >
          <template #suffix>
            <button type="button" @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>
      </div>
      <CommonNotification
        v-if="error"
        type="warning"
        text="Token not found, try changing the network."
      />
    </div>
    <div v-if="token" class="mb-7.5 flex items-center justify-between">
      <div class="text-gray-400">
        <p>{{ token.name }}</p>
        <p class="text-sm font-medium">
          {{ token.balance }} {{ token.symbol }}
        </p>
      </div>
      <div
        class="items-center justify-center rounded-2xl bg-gray-850 px-4 py-2.5 text-sm text-gray-400"
      >
        Decimals {{ token.decimals }}
      </div>
    </div>
    <CommonButton
      type="submit"
      :loading="loading"
      :disabled="disabled"
      size="lg"
      class="w-full items-center justify-center"
    >
      Add Token
    </CommonButton>
  </form>
</template>
