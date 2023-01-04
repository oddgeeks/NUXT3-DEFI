<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import { useField, useForm } from "vee-validate";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";
import * as yup from "yup";

interface ISwap {
  sellToken: {
    tokenAddress: string;
    amount: string;
  };
  buyToken: {
    tokenAddress: string;
  };
  slippage: number | string;
}

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  chainId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const { tokenBalances, chainTokenBalances, sendTransactions } =
  useAvocadoSafe();
const { getNetworkByChainId } = useNetworks();
const { account } = useWeb3();
const { toWei, fromWei } = useBignumber();
const { formatPercent } = useFormatter();
const { closeModal } = useModal();
const slippages = [
  { value: "0.1", label: "0.1%" },
  { value: "0.5", label: "0.5%" },
  { value: "1", label: "1%" },
  { value: "2", label: "2%" },
  { value: "3", label: "3%" },
];

const availableTokens = computed(() => {
  return tokenBalances.value.filter((t) => t.chainId === props.chainId);
});

const swap = ref({
  sellToken: {
    tokenAddress: props.address,
    amount: "",
  },
  buyToken: {
    tokenAddress: "",
  },
});

const availableBuyTokens = computed(() => {
  const tokens = chainTokenBalances.value[props.chainId];

  return tokens.filter((t) => t.address !== sellToken.value.address);
});

const { handleSubmit, errors, meta, validate, isSubmitting, resetForm } =
  useForm({
    initialValues: {
      amount: undefined,
      customSlippage: undefined,
      slippage: "2",
    },
    validationSchema: yup.object({
      amount: yup
        .string()
        .required("Amount is required")
        .test("max-amount", "Insufficient balance", (value) => {
          if (!value) return true;
          const sellToken = availableTokens.value.find(
            (t) => t.address === swap.value.sellToken.tokenAddress
          )!;

          const amount = toBN(value);
          const balance = toBN(sellToken.balance);

          return amount.gt(0) && amount.lte(balance);
        }),
      slippage: yup.string().required(),
      customSlippage: yup
        .string()
        .test("slippage", "Slippage must be between 0.1% and 3%", (value) => {
          const slippage = toBN(value);

          if (value) {
            return slippage.gte(0.1) && slippage.lte(3);
          } else return true;
        }),
    }),
  });

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: slippage } = useField<string>("slippage");
const { value: customSlippage, meta: slippageMeta } =
  useField<string>("customSlippage");

const sellToken = computed(() => {
  return chainTokenBalances.value[props.chainId].find(
    (t) => t.address === swap.value.sellToken.tokenAddress
  )!;
});

const buyToken = computed(() => {
  return chainTokenBalances.value[props.chainId].find(
    (t) => t.address === swap.value.buyToken.tokenAddress
  )!;
});

const sendingDisabled = computed(
  () => isSubmitting.value || pending.value || !meta.value.valid
);

const { data: swapDetails, pending } = useAsyncData(
  "swap-details",
  async () => {
    const { valid } = await validate();
    if (!valid) return;

    const { data }: { data: ISwapResponse } = await http.get(
      "https://swap-aggregator.instadapp.io/swap",
      {
        params: {
          network: getNetworkByChainId(
            Number(props.chainId)
          ).name.toLowerCase(),
          buyToken: buyToken.value.address,
          sellToken: sellToken.value.address,
          sellAmount: toWei(amount.value, sellToken.value.decimals),
          maxSlippage: customSlippage.value || slippage.value,
          slippage: slippage.value,
          user: account.value,
          access_token: "hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C",
        },
      }
    );

    return data;
  },
  {
    server: false,
    watch: [
      amount,
      swap.value.sellToken,
      swap.value.buyToken,
      slippage,
      customSlippage,
    ],
  }
);

const bestRoute = computed(() => swapDetails.value?.aggregators[0] || null);

const sellTokenInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data.sellTokenAmount || 0,
      swapDetails.value?.data.sellToken.decimals
    )
  )
    .times(swapDetails.value?.data.sellToken.price || 0)
    .toFixed(2);
});

const buyTokenAmount = computed(() => {
  return fromWei(
    swapDetails.value?.data.buyTokenAmount || 0,
    swapDetails.value?.data.buyToken.decimals
  );
});

const buyTokenAmountPerSellToken = computed(() => {
  if (!amount.value || !buyTokenAmount.value) return "0.00";
  return formatDecimal(div(buyTokenAmount.value, amount.value));
});

const sellTokenAmountPerBuyToken = computed(() => {
  if (!amount.value || !buyTokenAmount.value) return "0.00";

  return formatDecimal(div(amount.value, buyTokenAmount.value));
});

const buyTokenAmountInUsd = computed(() => {
  return toBN(buyTokenAmount.value).times(
    swapDetails.value?.data.buyToken.price || 0
  );
});

const swapTokens = () => {
  const sellTemp = swap.value.sellToken.tokenAddress;
  const buyTemp = swap.value.buyToken.tokenAddress;

  swap.value.buyToken.tokenAddress = sellTemp;
  swap.value.sellToken.tokenAddress = buyTemp;
};

const onSubmit = handleSubmit(async () => {
  const address = bestRoute.value?.data.to;
  const txs = [];

  if (!bestRoute.value?.data?.to || !address) return;

  const erc20 = Erc20__factory.connect(address, getRpcProvider(props.chainId));

  try {
    if (
      buyToken.value.address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    ) {
      const { data } = await erc20.populateTransaction.approve(
        address,
        bestRoute.value.data.sellTokenAmount
      );

      txs.push({
        to: buyToken.value.address,
        data,
      });
    }

    txs.push({
      to: bestRoute.value?.data?.to,
      data: bestRoute.value?.data.calldata,
      value: bestRoute.value?.data.value,
    });

    const transactionHash = await sendTransactions(txs, +props.chainId);

    resetForm();
    closeModal();

    showPendingTransactionModal(transactionHash, props.chainId);
  } catch (e: any) {
    openSnackbar({
      message: e.error?.message || e?.reason || "Something went wrong",
      type: "error",
    });
  }
});

onMounted(() => {
  // set initial buy token
  swap.value.buyToken.tokenAddress = availableBuyTokens.value[0].address;
});
</script>

<template>
  <form @submit="onSubmit" novalidate class="flex gap-7.5 flex-col">
    <div class="flex justify-center flex-col items-center">
      <div class="flex flex-col gap-[14px]">
        <h2 class="text-lg leading-5 text-center">Swap</h2>
        <div
          class="dark:bg-gray-850 bg-slate-50 px-3 py-[5px] inline-flex justify-center items-center gap-2 rounded-5"
        >
          <ChainLogo class="w-5 h-5" :chain="chainId" />
          <span class="text-xs text-slate-400 leading-5"
            >{{ chainIdToName(chainId) }} Network</span
          >
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
        class="py-4 px-5 relative dark:bg-slate-800 bg-slate-100 rounded-5 flex flex-col gap-4"
      >
        <div class="flex">
          <CommonInput
            transparent
            min="0.000001"
            step="0.000001"
            placeholder="0.0"
            name="amount"
            v-model="amount"
            class="flex-1"
            container-classes="!p-0"
          />
          <CommonSelect
            class="basis-40"
            v-model="swap.sellToken.tokenAddress"
            iconKey="logoURI"
            value-key="address"
            label-key="name"
            :options="availableTokens"
          />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <span>{{ formatUsd(sellTokenInUsd) }}</span>
          <div class="flex items-center gap-2.5">
            <span>{{ sellToken?.balance }} {{ sellToken?.symbol }}</span>
            <button
              type="button"
              @click="amount = sellToken?.balance"
              class="text-blue-500"
            >
              MAX
            </button>
          </div>
        </div>
        <span
          v-if="amountMeta.dirty && errors['amount']"
          class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
        >
          <SVGInfo /> {{ errors["amount"] }}
        </span>
        <button
          type="button"
          @click="swapTokens"
          class="flex justify-center items-center absolute bg-slate-150 dark:bg-slate-600 ring-[6px] ring-white dark:ring-gray-950 rounded-full h-10 w-10 -bottom-[26px] left-1/2 -translate-x-1/2"
        >
          <RefreshSVG class="w-[18px] h-[18px]" />
        </button>
      </div>

      <div
        class="py-4 px-5 dark:bg-slate-800 bg-slate-100 rounded-5 flex flex-col gap-4"
      >
        <div class="flex">
          <CommonInput
            transparent
            readonly
            placeholder="0.0"
            name="buy-token"
            :model-value="buyTokenAmount.toFixed(3)"
            class="flex-1"
            container-classes="!p-0"
          />
          <CommonSelect
            class="basis-40"
            v-model="swap.buyToken.tokenAddress"
            iconKey="logoURI"
            value-key="address"
            label-key="name"
            :options="availableBuyTokens"
          />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <span>{{ formatUsd(buyTokenAmountInUsd, 6) }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="px-5 pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5">
          <div class="flex flex-col gap-5">
            <div class="flex flex-1 gap-4 items-end">
              <div class="flex flex-col gap-2.5 flex-1">
                <span class="text-sm font-semibold">Slippage</span>
                <CommonSelect
                  v-model="slippage"
                  value-key="value"
                  label-key="label"
                  :container-classes="!customSlippage ? '!border-blue-500' : ''"
                  :options="slippages"
                >
                  <template #button-prefix>
                    <div
                      :class="{ '!border-blue-500': !customSlippage }"
                      class="radio !mr-0"
                    ></div>
                  </template>
                </CommonSelect>
              </div>
              <CommonInput
                name="slippage"
                placeholder="Custom"
                input-classes="!py-3"
                class="flex-1"
                :container-classes="customSlippage ? '!ring-blue-500' : ''"
                v-model="customSlippage"
              >
                <template #prefix>
                  <div
                    :class="{ '!border-blue-500': customSlippage }"
                    class="radio"
                  ></div>
                </template>
              </CommonInput>
            </div>

            <span
              v-if="slippageMeta.dirty && errors['customSlippage']"
              class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
            >
              <SVGInfo /> {{ errors["customSlippage"] }}
            </span>

            <div class="divider" />

            <div class="flex flex-col gap-4">
              <div
                class="flex text-slate-400 uppercase text-sm justify-between items-center"
              >
                <span>
                  1 {{ sellToken?.symbol }} = {{ buyTokenAmountPerSellToken }}
                  {{ buyToken?.symbol }}
                </span>
                <span>
                  1 {{ buyToken?.symbol }} = {{ sellTokenAmountPerBuyToken }}
                  {{ sellToken?.symbol }}
                </span>
              </div>
              <div class="flex justify-between text-sm items-center">
                <span>Price Impact</span>
                <span class="text-green-500">
                  {{
                    formatPercent(
                      toBN(bestRoute?.data.priceImpact || 0).negated()
                    )
                  }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-4 flex-col">
      <CommonButton
        type="submit"
        :disabled="sendingDisabled"
        :loading="isSubmitting || pending"
        class="justify-center w-full"
        size="lg"
      >
        Swap
      </CommonButton>
    </div>
  </form>
</template>

<style scoped>
.divider {
  @apply bg-dashed-pattern dark:bg-dashed-pattern-dark;
  background-position: bottom;
  background-size: 21px 2px;
  background-repeat: repeat-x;
  border: 0;
  height: 2px;
  position: relative;
}

.divider:after {
  @apply w-5 h-5 rounded-full absolute top-1/2 -right-10 -translate-x-1/2 -translate-y-1/2 dark:bg-gray-950 bg-white;
  content: "";
  display: block;
}

.divider:before {
  @apply w-5 h-5 rounded-full absolute top-1/2 -left-5 -translate-x-1/2 -translate-y-1/2 dark:bg-gray-950 bg-white;
  content: "";
  display: block;
}

.radio {
  @apply w-5 h-5 rounded-full border-[6.5px] dark:border-slate-600 mr-3 border-slate-300 shrink-0;
}
</style>
