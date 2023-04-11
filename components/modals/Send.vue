<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import SVGInfoCircle from "~/assets/images/icons/exclamation-circle.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";

const emit = defineEmits(["destroy"]);
const { toWei } = useBignumber();

const props = defineProps({
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
const { safeAddress, sendTransaction, tokenBalances, safe, isSafeAddress } =
  useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();

const tochainId = ref<string>(props.chainId);

const token = ref(
  tokenBalances.value.find(
    (t) => t.chainId === tochainId.value && t.address === props.address
  )!
);

const availableTokens = computed(() =>
  tokenBalances.value.filter((t) => t.chainId === tochainId.value)
);

watch(
  () => tochainId.value,
  () => {
    if (availableTokens.value.length > 0) {
      token.value = availableTokens.value[0];
    }
  }
);

const networks = availableNetworks.map((network) => {
  return {
    ...network,
    chainId: network.chainId.toString(),
  };
});

const amountInUsd = computed(() => {
  if (!token.value) return "0";
  return toBN(token.value.price || 0)
    .times(amount.value || "0")
    .toFixed();
});

const actualAddress = ref("");

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
      address: yup
        .string()
        .required("")
        .test("is-address", "Incorrect address", async (value) => {
          if (!value) return true;

          const resolvedAddress =
            value.endsWith(".eth") && tochainId.value === "1"
              ? await getRpcProvider(1).resolveName(value)
              : null;

          if (resolvedAddress) {
            actualAddress.value = resolvedAddress;
            return true;
          }

          if (isAddress(value)) {
            actualAddress.value = value;
            return true;
          }

          actualAddress.value = "";

          return false;
        }),
    }),
  });

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: address, meta: addressMeta } = useField<string>("address");

const setMax = () => {
  amount.value = toBN(token.value!.balance).decimalPlaces(6, 1).toString();
};

const pasteAddress = async () => {
  try {
    address.value = await navigator.clipboard.readText();
  } catch (e) {
    console.log(e);
    openSnackbar({
      message: "Please allow clipboard access",
      type: "error",
    });
  }
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
      to: actualAddress.value,
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
        actualAddress.value,
        transferAmount
      );

      tx.data = data!;
      tx.to = token.value.address;
    }

    return tx;
  },
  {
    watch: [amount, address],
  }
);

const { data: totalTransfers } = useAsyncData(
  async () => {
    if (!isAddress(actualAddress.value)) return;

    const toSafeAddress = await isSafeAddress(actualAddress.value);

    const res = await http("/api/transfers", {
      params: {
        from: safeAddress.value,
        to: actualAddress.value,
        chainId: toSafeAddress ? undefined : tochainId.value,
      },
    });

    return res.totalTransfers;
  },
  {
    watch: [actualAddress, tochainId],
  }
);

const { data, pending, error } = useEstimatedFee(tx, {
  chainId: tochainId.value,
});

const onSubmit = handleSubmit(async () => {
  if (!token.value) {
    return;
  }

  try {
    const metadata = encodeTransferMetadata({
      token: token.value.address,
      amount: toWei(amount.value, token.value.decimals),
      receiver: actualAddress.value,
    });

    let transactionHash = await sendTransaction(
      {
        ...(tx.value as any),
        chainId: Number(tochainId.value),
      },
      {
        metadata,
      }
    );

    console.log(transactionHash);

    logActionToSlack({
      message: `${formatDecimal(amount.value)} ${formatSymbol(
        token.value?.symbol
      )} to ${actualAddress.value}`,
      action: "send",
      txHash: transactionHash,
      chainId: tochainId.value,
      account: account.value,
    });

    resetForm();
    emit("destroy");

    showPendingTransactionModal(transactionHash, tochainId.value, "send");
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
    <div class="flex flex-col justify-center gap-[15px] items-center">
      <h2>Send</h2>
    </div>
    <div class="flex gap-x-4">
      <div class="space-y-2.5 flex flex-col w-full">
        <div class="flex items-center justify-between">
          <span class="text-sm">Coin</span>
        </div>
        <TokenSelection
          class="relative w-full flex items-center gap-2.5 max-h-12 rounded-2xl border-2 dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
          v-model="token"
          :tokens="availableTokens"
        />
      </div>
      <div class="space-y-2.5 flex flex-col w-full">
        <div class="flex items-center justify-between">
          <span class="text-sm">Network</span>
        </div>
        <CommonSelect
          v-model="tochainId"
          value-key="chainId"
          label-key="name"
          icon-key="icon"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="tochainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>
      <!-- end network select -->
    </div>
    <div class="space-y-5">
      <div class="space-y-2.5 flex flex-col">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm">Amount</span>
          </div>
          <div class="flex text-sm uppercase gap-x-3">
            <span>{{ formatDecimal(token.balance) }} {{ token.symbol }}</span>
            <button
              type="button"
              class="text-primary hover:text-primary"
              @click="setMax"
            >
              MAX
            </button>
          </div>
        </div>
        <CommonInput
          type="numeric"
          :error-message="amountMeta.dirty ? errors['amount'] : ''"
          name="amount"
          placeholder="Enter amount"
          v-model="amount"
        >
        </CommonInput>
        <span class="text-sm font-semibold text-left text-slate-400">
          {{ formatUsd(amountInUsd) }}</span
        >
      </div>

      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-sm">Address To</span>
          <span class="text-sm text-slate-400" v-if="totalTransfers">
            {{ totalTransfers }} previous
            {{ totalTransfers === 1 ? "send" : "sends" }}
          </span>
          <span
            class="text-sm text-orange-400 flex items-center gap-2"
            v-else-if="totalTransfers === 0"
          >
            <SVGInfoCircle /> First time send
          </span>
        </div>

        <CommonInput
          :error-message="addressMeta.dirty ? errors['address'] : ''"
          name="address"
          placeholder="Enter Address"
          v-model="address"
        >
          <template #suffix>
            <button
              v-tippy="{
                content: 'Paste from clipboard',
                trigger: 'mouseenter',
              }"
              type="button"
              @click="pasteAddress"
            >
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>

        <button
          type="button"
          @click="address = account"
          class="rounded-7.5 h-8 font-medium items-center justify-center flex px-3 text-xs ring-1 ring-slate-200 dark:ring-slate-700"
        >
          Owner {{ shortenHash(account) }}
        </button>
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
