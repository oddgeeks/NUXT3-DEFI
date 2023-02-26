<script setup lang="ts">
import { serializeError } from 'serialize-error'
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";
import type { IToken } from "~~/stores/tokens";
import { Erc20__factory } from "~~/contracts";
import { useField, useForm } from "vee-validate";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import ArrowLeft from "~/assets/images/icons/arrow-left.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
import * as yup from "yup";
import { storeToRefs } from "pinia";
import { utils } from "ethers";

interface ISwap {
  sellToken: IToken;
  buyToken: IToken;
}

let abortController = ref<AbortController | null>(null);

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

const { tokenBalances, sendTransactions, safeAddress, safe } = useAvocadoSafe();

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

const swapDetails = ref({
  data: null as  ISwapResponse | null,
  error: '',
  pending: false,
})
const [swapped, toggleSwapped] = useToggle();
const [isBuyAmountDirty, toggleDirty] = useToggle(false);
const refreshing = ref(false);

const swap = ref<ISwap>({
  sellToken: getTokenByAddress(props.address, props.chainId)!,
  buyToken: getTokenByAddress(props.address, props.chainId)!,
});

const availableTokens = computed(() =>
  tokens.value.filter((t) => t.chainId === props.chainId && t.address !== swap.value.buyToken.address)
);
const availableBuyTokens = computed(() =>
  availableTokens.value.filter(
    (t) => t.address !== swap.value.sellToken.address
  )
);

const sellTokenBalance = computed(
  () =>
    tokenBalances.value.find(
      (t) =>
        t.address === swap.value.sellToken.address &&
        t.chainId === String(props.chainId)
    )?.balance || "0.00"
);

const buyTokenBalance = computed(
  () =>
    tokenBalances.value.find(
      (t) =>
        t.address === swap.value.buyToken.address &&
        t.chainId === String(props.chainId)
    )?.balance || "0.00"
);

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
        .test("slippage", "Slippage must be between 0.1% and 100%", (value) => {
          const slippage = toBN(value!);

          if (value) {
            return slippage.gte(0.1) && slippage.lte(100);
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
const {
  value: customSlippage,
  meta: slippageMeta,
  setState: setCustomSlippage,
} = useField<string>("customSlippage");

const actualSlippage = computed(() => customSlippage.value || slippage.value);

const convertBuytoSellAmount = (val: string) => {
  const sellTokenPrice = swap.value.sellToken.price;
  const buyTokenPrice = swap.value.buyToken.price;

  if (!sellTokenPrice || !buyTokenPrice) return;

  const buyAmountInSellAmount = toBN(val)
    .div(toBN(sellTokenPrice))
    .times(toBN(buyTokenPrice))
    .decimalPlaces(4)
    .toFixed();

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
  sellAmount.value = toBN(sellTokenBalance.value)
    .decimalPlaces(6, 1)
    .toString();
};

const handleSellAmountInput = () => {
  toggleDirty(false);
};

const sendingDisabled = computed(
  () =>
    isSubmitting.value ||
    swapDetails.value.pending ||
    !meta.value.valid ||
    feePending.value ||
    isPriceImpactHigh.value ||
    !!swapDetails.value.error
);

const isLoading = computed(
  () => swapDetails.value.pending && meta.value.valid && !refreshing.value
);

const fetchSwapDetails = async () => {
  const { valid } = await validate();

    if (!valid) return;

    try {
      pause();

      if (abortController.value) {
        abortController.value.abort();
      }

      abortController.value = new AbortController();

      swapDetails.value.pending = true;

      const data: ISwapResponse = await http(
        "https://swap-aggregator.instadapp.io/swap",
        {
          signal: abortController.value?.signal,
          params: {
            network: getNetworkByChainId(
              Number(props.chainId)
            ).name.toLowerCase(),
            buyToken: swap.value.buyToken.address,
            sellToken: swap.value.sellToken.address,
            sellAmount: toWei(sellAmount.value, swap.value.sellToken.decimals),
            maxSlippage: actualSlippage.value,
            slippage: actualSlippage.value,
            user: safeAddress.value,
            access_token: "hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C",
          },
        }
      );

      abortController.value = null;

      const best = data?.aggregators[0];

      if (!best) {
        swapDetails.value.error = "No route found, please try again later";
        return;
      }

      if (best && !isBuyAmountDirty.value) {
        buyAmount.value = formatDecimal(
          fromWei(
            best.data.buyTokenAmount,
            best.data.buyToken.decimals
          ).toFixed(),
          6
        );
      }

      swapDetails.value.data = data;
      swapDetails.value.pending = false;
      swapDetails.value.error = '';
    } catch (e: any) {
      const error = serializeError(e)

      if (error?.message.includes('aborted')) return;

      swapDetails.value.pending = false;
      swapDetails.value.error = "No route found, please try again later.";
    } 
}

const { pause, resume } = useIntervalFn(
  () => {
    fetchSwapDetails()
    refreshing.value = true;
  },
  10000,
  {
    immediate: true,
  }
);

const bestRoute = computed(() => swapDetails.value?.data?.aggregators[0] || null);

const priceImpact = computed(() =>
  toBN(bestRoute?.value?.data?.priceImpact || 0)
    .abs()
    .toFixed()
);

const isPriceImpactHigh = computed(() => {
  if (!bestRoute.value) return false;

  return toBN(priceImpact.value).gt(actualSlippage.value);
});

const sellAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.sellTokenAmount || 0,
      swapDetails.value?.data?.data.sellToken.decimals
    )
  )
    .times( swapDetails.value?.data?.data.sellToken.price || 0)
    .toFixed(2);
});

const buyAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.buyTokenAmount || 0,
      swapDetails.value?.data?.data.buyToken.decimals
    )
  )
    .times( swapDetails.value?.data?.data.buyToken.price || 0)
    .toFixed(2);
});

const minRecievedAfterSlippage = computed(() => {
  return fromWei(
    swapDetails.value?.data?.data.buyTokenAmount || 0,
    swap.value.buyToken.decimals
  )
    .div(toBN(1).plus(toBN(actualSlippage.value).div(100)))
    .decimalPlaces(5);
});

const buyTokenAmountPerSellToken = computed(() => {
  const value = div(buyAmount.value, sellAmount.value);

  return value.isFinite() ? formatDecimal(value.toFixed()) : "0.00";
});

const sellTokenAmountPerBuyToken = computed(() => {
  const value = div(sellAmount.value, buyAmount.value);

  return value.isFinite() ? formatDecimal(value.toFixed()) : "0.00";
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
    try {
      pause();
      const txs = await getTxs();
      const message = await safe.value?.generateSignatureMessage(
        txs,
        +props.chainId
      );

      const data = await provider.send("txn_estimateFeeWithoutSignature", [
        message,
        account.value,
        props.chainId,
      ]);

      return data;
    } finally {
      resume();
      refreshing.value = false;
    }
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
    pause()
    const txs = await getTxs();

    const metadata = encodeSwapMetadata({
      buyAmount:  swapDetails.value?.data?.data.buyTokenAmount!,
      sellAmount:  swapDetails.value?.data?.data.sellTokenAmount!,
      buyToken:  swapDetails.value?.data?.data.buyToken.address!,
      sellToken: swap.value.sellToken.address,
      receiver: account.value,
      protocol: utils.formatBytes32String(bestRoute?.value?.name || ""),
    });

    const transactionHash = await sendTransactions(txs, +props.chainId, {
      metadata,
    });

    const buyAmt = fromWei(
      swapDetails.value?.data?.data.buyTokenAmount || 0,
      swapDetails.value?.data?.data.buyToken.decimals
    ).toFixed();

    const sellAmt = fromWei(
      swapDetails.value?.data?.data.sellTokenAmount || 0,
      swapDetails.value?.data?.data.sellToken.decimals
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
  } finally {
    resume();
  }
});

onMounted(() => {
  // set initial buy token
  const eth = availableBuyTokens.value.find((i) => i.symbol.includes("eth"));
  const usdc = availableBuyTokens.value.find((i) => i.symbol === "usdc");

  const isEth = swap.value.sellToken.symbol.includes("eth");

  swap.value.buyToken = getTokenByAddress(
    props.toAddress ||
      (isEth ? usdc?.address : eth?.address) ||
      availableBuyTokens.value[0].address,
    props.chainId
  )!;

  if (props.amount) {
    setSellAmount({
      value: props.amount,
      touched: true,
    });
  }
});

watch([() => swap.value.sellToken, () => swap.value.buyToken], () => {
  toggleSwapped();
});

watch(sellAmount, () => {
  if (!sellAmount.value) {
    buyAmount.value = "";
  }
});

watch(slippage, () => {
  setCustomSlippage({
    value: undefined,
  });
});

watch([sellAmount, swapped, slippage, customSlippage], () => {
  fetchSwapDetails()
})

onUnmounted(() => {
  abortController.value?.abort();
  pause();
});
</script>

<template>
  <form @submit="onSubmit" novalidate class="flex gap-7.5 flex-col">
    <div class="flex justify-center flex-col items-center">
      <div class="flex flex-col gap-[15px]">
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
        class="py-4 px-5 relative dark:bg-slate-800 bg-slate-100 focus-within:bg-slate-50 border-2 border-transparent focus-within:dark:border-slate-800 focus-within:border-slate-150 focus-within:dark:bg-gray-850 rounded-5 flex flex-col gap-4"
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
            input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
            container-classes="!px-0"
          />
          <TokenSelection v-model="swap.sellToken" :tokens="availableTokens" />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <div
            v-if="isLoading"
            style="width: 60px; height: 20px"
            class="loading-box rounded-lg"
          />
          <span v-else>{{ formatUsd(sellAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium"
              >{{ formatDecimal(sellTokenBalance) }}
              {{ swap.sellToken?.symbol }}</span
            >
            <button type="button" @click="setMax" class="text-primary">
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
        class="py-4 px-5 dark:bg-slate-800 bg-slate-100 focus-within:bg-slate-50 border-2 border-transparent focus-within:dark:border-slate-800 focus-within:border-slate-150 focus-within:dark:bg-gray-850 rounded-5 flex flex-col gap-4"
      >
        <div class="flex">
          <div class="flex-1 flex items-center">
            <div
              v-if="isLoading"
              style="width: 100px; height: 28px"
              class="loading-box rounded-lg"
            />
            <CommonInput
              v-else
              transparent
              type="numeric"
              placeholder="0.0"
              name="buy-amount"
              @input="handleBuyAmountInput"
              v-model="buyAmount"
              class="flex-1"
              input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              container-classes="!px-0"
            />
          </div>
          <TokenSelection
            v-model="swap.buyToken"
            :tokens="availableBuyTokens"
          />
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <div
            v-if="isLoading"
            style="width: 60px; height: 20px"
            class="loading-box rounded-lg"
          />
          <span v-else>{{ formatUsd(buyAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium"
              >{{ formatDecimal(buyTokenBalance) }}
              {{ swap.buyToken?.symbol }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="px-5 pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5">
          <div class="flex flex-col gap-5">
            <details class="group flex flex-col">
              <summary
                class="text-sm font-semibold flex justify-between cursor-pointer"
              >
                <span class="inline-flex gap-2.5">
                  Slippage

                  <button
                    type="button"
                    v-tippy="
                      'Slippage is the difference between the expected price of an order and the price when the order actually executes. The slippage tolerance % lets you decide how much slippage you are willing to accept for a trade.'
                    "
                  >
                    <QuestionCircleSVG class="w-5 h-5 text-primary" />
                  </button>
                </span>
                <ChevronDownSVG
                  class="w-5 text-slate-400 group-open:rotate-180"
                />
              </summary>
              <div class="flex flex-1 gap-4 items-end mt-4">
                <div class="flex flex-col gap-2.5 flex-1">
                  <CommonSelect
                    v-model="slippage"
                    value-key="value"
                    label-key="label"
                    :container-classes="
                      !customSlippage ? '!border-primary' : ''
                    "
                    :options="slippages"
                  >
                    <template #button-prefix>
                      <div
                        :class="{ '!border-primary': !customSlippage }"
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
                  :container-classes="customSlippage ? '!ring-primary' : ''"
                  v-model="customSlippage"
                >
                  <template #prefix>
                    <div
                      :class="{ '!border-primary': customSlippage }"
                      class="radio"
                    ></div>
                  </template>
                </CommonInput>
              </div>
              <span
                v-if="slippageMeta.dirty && errors['customSlippage']"
                class="text-xs flex gap-2 items-center text-left mt-4 text-red-alert"
              >
                <SVGInfo /> {{ errors["customSlippage"] }}
              </span>
            </details>

            <div class="divider" />

            <div class="flex flex-col gap-4">
              <div
                class="flex text-slate-400 font-medium uppercase text-sm justify-between items-center"
              >
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span v-else>
                  1 {{ swap.sellToken?.symbol }} =
                  {{ buyTokenAmountPerSellToken }}
                  {{ swap.buyToken?.symbol }}
                </span>
                <div
                  v-if="isLoading"
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
                class="flex text-slate-400 font-medium text-sm justify-between items-center"
              >
                <span>
                  Minimum Received after slippage ({{ actualSlippage }}%)
                </span>
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span class="uppercase" v-else>
                  {{ minRecievedAfterSlippage }}
                  {{ swap.buyToken.symbol }}
                </span>
              </div>
              <div
                class="flex justify-between text-sm items-center font-medium"
              >
                <span :class="{ '!text-red-alert': gt(priceImpact, 0.04) }"
                  >Price Impact</span
                >
                <div
                  v-if="isLoading"
                  style="width: 100px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span
                  v-else
                  :class="{ '!text-red-alert': gt(priceImpact, 0.04) }"
                >
                  {{ formatPercent(priceImpact) }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <EstimatedFee :chain-id="chainId" :loading="feePending" :data="fee" />
      <CommonNotification
        v-if="swapDetails.error"
        type="error"
        :text="swapDetails.error"
      />
      <CommonNotification
        v-if="isPriceImpactHigh"
        type="warning"
        text="Slippage value should be greater than price impact.  "
      />
    </div>

    <div class="flex gap-4 flex-col">
      <CommonButton
        type="submit"
        :disabled="sendingDisabled"
        :loading="isSubmitting || swapDetails.pending || feePending"
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
