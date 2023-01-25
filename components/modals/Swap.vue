<script setup lang="ts">
import type { IToken } from "~~/stores/tokens";
import { Erc20__factory } from "~~/contracts";
import { useField, useForm } from "vee-validate";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";
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
});

const { chainTokenBalances, sendTransactions, safeAddress, safe } = useAvocadoSafe();

const { getTokenByAddress } = useTokens();
const { tokens } = storeToRefs(useTokens());
const { getNetworkByChainId } = useNetworks();
const { toWei, fromWei } = useBignumber();
const { formatPercent } = useFormatter();
const { parseTransactionError } = useErrorHandler();
const { account } = useWeb3()

const slippages = [
  { value: "0.1", label: "0.1%" },
  { value: "0.5", label: "0.5%" },
  { value: "1", label: "1%" },
  { value: "2", label: "2%" },
  { value: "3", label: "3%" },
];

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
        .required("")
        .test("min-amount", "", (value) => {
          const amount = toBN(value);

          return value ? amount.gt(0) : true;
        })
        .test("max-amount", "Insufficient balance", (value) => {
          const amount = toBN(value);
          const balance = toBN(sellTokenBalance.value);

          return amount.gt(0) ? amount.lte(balance) : true;
        }),
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

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: slippage } = useField<string>("slippage");
const { value: customSlippage, meta: slippageMeta } =
  useField<string>("customSlippage");

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
          sellAmount: toWei(amount.value, swap.value.sellToken.decimals),
          maxSlippage: customSlippage.value || slippage.value,
          slippage: slippage.value,
          user: safeAddress.value,
          access_token: "hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C",
        },
      }
    );

    return data;
  },
  {
    server: false,
    watch: [amount, swap.value, slippage, customSlippage],
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
  const sellTemp = swap.value.sellToken;
  const buyTemp = swap.value.buyToken;

  swap.value.buyToken = sellTemp;
  swap.value.sellToken = buyTemp;
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

    resetForm();
    emit("destroy");

    showPendingTransactionModal(transactionHash, props.chainId, "swap");
  } catch (e: any) {
    openSnackbar({
      message: parseTransactionError(e),
      type: "error",
    });
  }
});

onMounted(() => {
  // set initial buy token
  swap.value.buyToken = getTokenByAddress(
    props.toAddress || availableBuyTokens.value[0].address,
    props.chainId
  )!;
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
            type="numeric"
            min="0.000001"
            step="0.000001"
            placeholder="0.0"
            name="amount"
            v-model="amount"
            class="flex-1"
            input-classes="text-[26px] placeholder:text-[26px]"
            container-classes="!p-0"
          />
          <TokenSelection v-model="swap.sellToken" :tokens="availableTokens" />
          <!-- <CommonSelect class="basis-40" v-model="swap.sellToken.tokenAddress" iconKey="logoURI" value-key="address"
            selected-label-classes="uppercase" item-text-classes="uppercase" label-key="symbol"
            :options="availableTokens" /> -->
        </div>
        <div class="flex justify-between items-center text-sm text-slate-400">
          <div
            v-if="pending && meta.valid"
            style="width: 100px; height: 20px"
            class="loading-box rounded-lg"
          />
          <span v-else>{{ formatUsd(sellTokenInUsd) }}</span>
          <div class="flex items-center gap-2.5 uppercase">
            <span>{{ sellTokenBalance }} {{ swap.sellToken?.symbol }}</span>
            <button
              type="button"
              @click="amount = sellTokenBalance"
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
          <div class="flex-1 flex items-center">
            <div
              v-if="pending && meta.valid"
              style="width: 100px; height: 34px"
              class="loading-box rounded-[10px]"
            />
            <CommonInput
              v-else
              transparent
              readonly
              placeholder="0.0"
              name="buy-token"
              :model-value="buyTokenAmount.toFixed(3)"
              container-classes="!py-0 !p-0"
              input-classes="!py-0 !p-0 text-[26px]"
            />
          </div>
          <TokenSelection
            v-model="swap.buyToken"
            :tokens="availableBuyTokens"
          />
        </div>
        <div
          v-if="pending && meta.valid"
          style="width: 100px; height: 20px"
          class="loading-box rounded-lg"
        />
        <div
          v-else
          class="flex justify-between items-center text-sm text-slate-400"
        >
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
                class="flex text-slate-400 uppercase text-sm justify-between items-center"
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
              <div class="flex justify-between text-sm items-center">
                <span>Price Impact</span>
                <div
                  v-if="pending && meta.valid"
                  style="width: 100px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span v-else class="text-green-500">
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

    <EstimatedFee :loading="feePending" :data="fee" />
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
