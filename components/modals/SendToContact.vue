<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";
import { storeToRefs } from "pinia";

const emit = defineEmits(["destroy"]);
const { toWei } = useBignumber();

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  chainId: {
    type: String,
    required: true,
  },
});

const { library, account } = useWeb3();
const { sendTransaction } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();

const { tokens } = storeToRefs(useTokens());

const availableTokens = computed(
  () => tokens.value.filter((t) => t.chainId === props.chainId)!
);

const token = ref<IToken>(availableTokens.value[0]);

const amountInUsd = computed(() => {
  if (!token.value) return "0";
  return toBN(token.value.price || 0)
    .times(amount.value || "0")
    .toFixed();
});

const { handleSubmit, errors, meta, resetForm, validate, isSubmitting } =
  useForm({
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
          const balance = toBN(token.value.balance);

          return amount.gt(0) ? amount.lte(balance) : true;
        }),
    }),
  });

const { value: amount, meta: amountMeta } = useField<string>("amount");

const setMax = () => {
  amount.value = toBN(token.value!.balance).decimalPlaces(6, 1).toString();
};

const sendingDisabled = computed(
  () =>
    !token.value ||
    isSubmitting.value ||
    !meta.value.valid ||
    pending.value ||
    !!error.value
);

const { data: tx } = useAsyncData(
  async () => {
    const { valid } = await validate();
    if (!valid) return;

    const transferAmount = toBN(amount.value)
      .times(10 ** token.value.decimals)
      .toFixed(0);

    let tx = {
      from: account.value,
      to: props.address,
      value: "0",
      data: "0x",
    };

    if (token.value.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      tx.value = transferAmount;
    } else {
      const contract = Erc20__factory.connect(
        token.value.address,
        library.value
      );

      const { data } = await contract.populateTransaction.transfer(
        props.address,
        transferAmount
      );

      tx.data = data!;
      tx.to = token.value.address;
    }

    return tx;
  },
  {
    watch: [amount],
  }
);

const { data, pending, error } = useEstimatedFee(tx, {
  chainId: props.chainId,
});

const onSubmit = handleSubmit(async () => {
  if (!token.value) {
    return;
  }

  try {
    const metadata = encodeTransferMetadata({
      token: token.value.address,
      amount: toWei(amount.value, token.value.decimals),
      receiver: props.address,
    });

    let transactionHash = await sendTransaction(
      {
        ...(tx.value as any),
        chainId: Number(props.chainId),
      },
      {
        metadata,
      }
    );

    logActionToSlack({
      message: `${formatDecimal(amount.value)} ${formatSymbol(
        token.value?.symbol
      )} to ${props.address}`,
      action: "send",
      txHash: transactionHash,
      chainId: props.chainId,
      account: account.value,
    });

    resetForm();
    emit("destroy");

    showPendingTransactionModal(transactionHash, props.chainId, "send");
  } catch (e: any) {
    const err = parseTransactionError(e);

    openSnackbar({
      message: err.formatted,
      type: "error",
    });

    logActionToSlack({
      message: err.formatted,
      action: "send",
      type: "error",
      account: account.value,
      errorDetails: err.parsed,
    });
  }
});
</script>

<template>
  <form @submit="onSubmit" class="text-center flex gap-7.5 flex-col">
    <div
      class="flex flex-col border-b-[1px] border-b-slate-800 -mx-[50px] px-[50px] pb-7.5 gap-7.5"
    >
      <h2 class="text-lg font-semibold">
        {{ props.name }}
      </h2>
      <div class="flex items-center gap-3 rounded-5 p-5 bg-gray-800">
        <ChainLogo :stroke="false" class="w-7 h-7" :chain="props.chainId" />
        <Copy :text="props.address">
          <template #content>
            <span class="text-white">{{ shortenHash(props.address) }}</span>
          </template>
        </Copy>
      </div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5 flex flex-col">
        <span class="text-sm text-left">Token</span>
        <TokenSelection
          v-model="token"
          :tokens="availableTokens"
          class="rounded-2xl border-2 border-slate-700 justify-between"
        />
      </div>
      <div class="space-y-2.5 flex flex-col">
        <div class="flex justify-between items-center">
          <span class="text-sm">Amount</span>
          <span class="uppercase text-sm">
            {{ formatDecimal(token.balance) }} {{ token.symbol }}
          </span>
        </div>
        <CommonInput
          type="numeric"
          :error-message="amountMeta.dirty ? errors['amount'] : ''"
          name="amount"
          placeholder="Enter amount"
          v-model="amount"
        >
          <template #suffix>
            <button
              type="button"
              class="text-primary hover:text-primary"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
        <span class="text-slate-400 text-sm text-left font-semibold">
          {{ formatUsd(amountInUsd) }}</span
        >
      </div>

      <div
        class="dark:bg-gray-850 !mt-5 bg-slate-50 px-3 py-2 flex space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="token.chainId" />
        <span class="text-xs font-medium leading-5">
          Sending on the {{ chainIdToName(token.chainId) }} network
        </span>
      </div>

      <EstimatedFee
        :chain-id="chainId"
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
