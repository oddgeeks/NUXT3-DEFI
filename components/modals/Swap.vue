<script setup lang="ts">
import type { IToken } from "~~/stores/tokens";
import { Erc20__factory } from "~~/contracts";
import { useField, useForm } from "vee-validate";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import ArrowLeft from "~/assets/images/icons/arrow-left.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
import * as yup from "yup";
import { storeToRefs } from "pinia";

interface ISwap {
  sellToken: IToken;
  buyToken: IToken;
}

const provider = getRpcProvider(634);

const emit = defineEmits(["destroy"]);

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  toAddress: {
    type: String,
  },
  chainId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: String,
    default: "",
  },
});

const { chainTokenBalances, sendTransactions, safeAddress, safe } =
  useAvocadoSafe();

const { getTokenByAddress } = useTokens();
const { tokens } = storeToRefs(useTokens());
const { getNetworkByChainId } = useNetworks();
const { toWei, fromWei } = useBignumber();
const { formatPercent } = useFormatter();
const { parseTransactionError } = useErrorHandler();
const { account } = useWeb3();

const slippages = [
  { value: "0.1", label: "0.1%" },
  { value: "0.5", label: "0.5%" },
  { value: "1", label: "1%" },
  { value: "2", label: "2%" },
  { value: "3", label: "3%" },
];

const [swapped, toggleSwapped] = useToggle();
const [isBuyAmountDirty, toggleDirty] = useToggle(false);

const swap = ref<ISwap>({
  sellToken: getTokenByAddress(props.address, props.chainId)!,
  buyToken: getTokenByAddress(props.address, props.chainId)!,
});

const availableTokens = computed(() =>
  tokens.value.filter((t) => t.chainId === props.chainId)
);
const availableBuyTokens = computed(() =>
  availableTokens.value.filter(
    (t) => t.address !== swap.value.sellToken.address
  )
);

const sellTokenBalance = computed(
  () =>
    chainTokenBalances.value[String(props.chainId)].find(
      (t) => t.address === swap.value.sellToken.address
    )?.balance || "0.00"
);

const buyTokenBalance = computed(
  () =>
    chainTokenBalances.value[String(props.chainId)].find(
      (t) => t.address === swap.value.buyToken.address
    )?.balance || "0.00"
);

watch([() => swap.value.sellToken, () => swap.value.buyToken], () => {
  toggleSwapped();
});

const validateMinAmount = (value: any) => {
  const amount = toBN(value);

  return value ? amount.gt(0) : true;
};

const validateMaxAmount = (value: any, balance: string) => {
  const amount = toBN(value);

  return amount.gt(0) ? amount.lte(toBN(balance)) : true;
};

const { handleSubmit, errors, meta, validate, isSubmitting, resetForm } =
  useForm({
    initialValues: {
      "sell-amount": undefined,
      "buy-amount": undefined,
      customSlippage: undefined,
      slippage: "2",
    },
    validationSchema: yup.object({
      "sell-amount": yup
        .string()
        .required("")
        .test("min-amount", "", validateMinAmount)
        .test("max-amount", "Insufficient balance", (val: any) =>
          validateMaxAmount(val, sellTokenBalance.value)
        ),
      slippage: yup.string().required(),
      customSlippage: yup
        .string()
        .test("slippage", "Slippage must be between 0.1% and 3%", (value) => {
          const slippage = toBN(value!);

          if (value) {
            return slippage.gte(0.1) && slippage.lte(3);
          } else return true;
        }),
    }),
  });

const buyAmount = ref();
const {
  value: sellAmount,
  meta: sellAmountMeta,
  setState: setSellAmount,
} = useField<string>("sell-amount");

const { value: slippage } = useField<string>("slippage");
const { value: customSlippage, meta: slippageMeta } =
  useField<string>("customSlippage");

const convertBuytoSellAmount = (val: string) => {
  const sellTokenPrice = swap.value.sellToken.price;
  const buyTokenPrice = swap.value.buyToken.price;

  if (!sellTokenPrice || !buyTokenPrice) return;

  const buyAmountInSellAmount = formatDecimal(
    toBN(val).div(toBN(sellTokenPrice)).times(toBN(buyTokenPrice)).toFixed(),
    6
  );

  setSellAmount({
    touched: true,
    value: buyAmountInSellAmount,
  });
};

const handleBuyAmountInput = (e: any) => {
  const val = e.target.value;

  if (val) convertBuytoSellAmount(val);

  toggleDirty(true);
};

const setMax = () => {
  toggleDirty(false);
  sellAmount.value = sellTokenBalance.value;
};

const handleSellAmountInput = () => {
  toggleDirty(false);
};

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
          buyToken: swap.value.buyToken.address,
          sellToken: swap.value.sellToken.address,
          sellAmount: toWei(sellAmount.value, swap.value.sellToken.decimals),
          maxSlippage: customSlippage.value || slippage.value,
          slippage: slippage.value,
          user: safeAddress.value,
          access_token: "hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C",
        },
      }
    );

    const bestRoute = data?.aggregators[0];

    if (bestRoute && !isBuyAmountDirty.value) {
      buyAmount.value = formatDecimal(
        fromWei(
          bestRoute.data.buyTokenAmount,
          bestRoute.data.buyToken.decimals
        ).toFixed(),
        6
      );
    }

    return data;
  },
  {
    server: false,
    watch: [sellAmount, swapped, slippage, customSlippage],
  }
);

const bestRoute = computed(() => swapDetails.value?.aggregators[0] || null);

const sellAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data.sellTokenAmount || 0,
      swapDetails.value?.data.sellToken.decimals
    )
  )
    .times(swapDetails.value?.data.sellToken.price || 0)
    .toFixed(2);
});

const buyAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data.buyTokenAmount || 0,
      swapDetails.value?.data.buyToken.decimals
    )
  )
    .times(swapDetails.value?.data.buyToken.price || 0)
    .toFixed(2);
});

const buyTokenAmountPerSellToken = computed(() => {
  if (!sellAmount.value || !buyAmount.value) return "0.00";
  return formatDecimal(div(buyAmount.value, sellAmount.value).toFixed());
});

const sellTokenAmountPerBuyToken = computed(() => {
  if (!sellAmount.value || !buyAmount.value) return "0.00";

  return formatDecimal(div(sellAmount.value, buyAmount.value).toFixed());
});

const swapTokens = () => {
  const sellTemp = swap.value.sellToken;
  const buyTemp = swap.value.buyToken;

  swap.value.buyToken = sellTemp;
  swap.value.sellToken = buyTemp;
  toggleSwapped();
};

const { data: fee, pending: feePending } = useAsyncData(
  "swap-fee",
  async () => {
    const txs = await getTxs();

    const message = await safe.value?.generateSignatureMessage(
      txs,
      +props.chainId
    );

    return provider.send("txn_estimateFeeWithoutSignature", [
      message,
      account.value,
      props.chainId,
    ]);
  },
  {
    server: false,
    watch: [bestRoute],
  }
);

const getTxs = async () => {
  const address = bestRoute.value?.data.to;

  if (!address) throw new Error("Route not found");

  const erc20 = Erc20__factory.connect(address, getRpcProvider(props.chainId));

  const txs = [];

  if (
    swap.value.sellToken.address !==
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  ) {
    const { data } = await erc20.populateTransaction.approve(
      bestRoute.value.data.allowanceSpender || address,
      bestRoute.value.data.sellTokenAmount
    );

    txs.push({
      to: swap.value.sellToken.address,
      data,
    });
  }

  txs.push({
    to: address,
    data: bestRoute.value?.data.calldata,
    value: bestRoute.value?.data.value,
  });

  return txs;
};

const onSubmit = handleSubmit(async () => {
  try {
    const txs = await getTxs();

    const transactionHash = await sendTransactions(txs, +props.chainId);

    const buyAmt = fromWei(
      swapDetails.value?.data.buyTokenAmount || 0,
      swapDetails.value?.data.buyToken.decimals
    ).toFixed();

    const sellAmt = fromWei(
      swapDetails.value?.data.sellTokenAmount || 0,
      swapDetails.value?.data.sellToken.decimals
    ).toFixed();

    logActionToSlack({
      message: `${formatDecimal(sellAmt)} ${formatSymbol(
        swap.value.sellToken.symbol
      )} to ${formatDecimal(buyAmt)} ${formatSymbol(
        swap.value.buyToken.symbol
      )}`,
      action: "swap",
      account: account.value,
      chainId: props.chainId,
      txHash: transactionHash,
    });

    resetForm();
    emit("destroy");

    showPendingTransactionModal(transactionHash, props.chainId, "swap");
  } catch (e: any) {
    const err = parseTransactionError(e);
    openSnackbar({
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: err,
      type: "error",
      action: "swap",
      account: account.value,
    });
  }
});

onMounted(() => {
  // set initial buy token
  swap.value.buyToken = getTokenByAddress(
    props.toAddress || availableBuyTokens.value[0].address,
    props.chainId
  )!;

  if (props.amount) {
    setSellAmount({
      value: props.amount,
      touched: true,
    });
  }
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
          <span class="text-xs text-slate-400 leading-5">{{
            chainIdToName(chainId)
          }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
        class="py-4 px-5 relative dark:bg-slate-800 bg-slate-100 rounded-5 flex flex-col gap-4"
      >
        <div class="flex">
          <CommonInput
            autofocus
            transparent
            placeholder="0.0"
            name="sell-amount"
            @input="handleSellAmountInput"
            v-model="sellAmount"
            type="numeric"
            class="flex-1"
            input-classes="text-[26px] placeholder:text-[26px] !p-0 leading-[48px] rounded-none"
            container-classes="!px-0"
          />
          <TokenSelection v-model="swap.sellToken" :tokens="availableTokens" />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <div
            v-if="pending && meta.valid"
            style="width: 100px; height: 20px"
            class="loading-box rounded-lg"
          />
          <span v-else>{{ formatUsd(sellAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium"
              >{{ sellTokenBalance }} {{ swap.sellToken?.symbol }}</span
            >
            <button type="button" @click="setMax" class="text-blue-500">
              MAX
            </button>
          </div>
        </div>
        <span
          v-if="sellAmountMeta.dirty && errors['sell-amount']"
          class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
        >
          <SVGInfo /> {{ errors["sell-amount"] }}
        </span>
        <button
          type="button"
          @click="swapTokens"
          class="flex justify-center items-center absolute bg-slate-150 dark:bg-slate-600 ring-[6px] ring-white dark:ring-gray-950 rounded-full h-10 w-10 -bottom-[26px] left-1/2 -translate-x-1/2"
        >
          <ArrowLeft class="w-5 h-5 -rotate-90 text-slate-400" />
        </button>
      </div>

      <div
        class="py-4 px-5 dark:bg-slate-800 bg-slate-100 rounded-5 flex flex-col gap-4"
      >
        <div class="flex">
          <div class="flex-1 flex items-center">
            <CommonInput
              transparent
              type="numeric"
              placeholder="0.0"
              name="buy-amount"
              @input="handleBuyAmountInput"
              v-model="buyAmount"
              class="flex-1"
              input-classes="text-[26px] placeholder:text-[26px] !p-0 leading-[48px] rounded-none"
              container-classes="!px-0"
            />
          </div>
          <TokenSelection
            v-model="swap.buyToken"
            :tokens="availableBuyTokens"
          />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <span>{{ formatUsd(buyAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium"
              >{{ buyTokenBalance }} {{ swap.buyToken?.symbol }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="px-5 pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5">
          <div class="flex flex-col gap-5">
            <div class="flex flex-1 gap-4 items-end">
              <div class="flex flex-col gap-2.5 flex-1">
                <div class="text-sm font-semibold inline-flex gap-2.5">
                  Slippage

                  <button
                    v-tippy="
                      'Slippage is the difference between the expected price of an order and the price when the order actually executes. The slippage tolerance % lets you decide how much slippage you are willing to accept for a trade.'
                    "
                  >
                    <QuestionCircleSVG class="w-5 h-5" />
                  </button>
                </div>
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
                class="flex text-slate-400 font-medium uppercase text-sm justify-between items-center"
              >
                <div
                  v-if="pending && meta.valid"
                  style="width: 140px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span v-else>
                  1 {{ swap.sellToken?.symbol }} =
                  {{ buyTokenAmountPerSellToken }}
                  {{ swap.buyToken?.symbol }}
                </span>
                <div
                  v-if="pending && meta.valid"
                  style="width: 140px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span v-else>
                  1 {{ swap.buyToken?.symbol }} =
                  {{ sellTokenAmountPerBuyToken }}
                  {{ swap.sellToken?.symbol }}
                </span>
              </div>
              <div
                class="flex justify-between text-sm items-center font-medium"
              >
                <span>Price Impact</span>
                <div
                  v-if="pending && meta.valid"
                  style="width: 100px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span v-else class="text-green-400">
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
      <EstimatedFee :chain-id="chainId" :loading="feePending" :data="fee" />
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
