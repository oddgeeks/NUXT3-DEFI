<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
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
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction, tokenBalances, safe } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();

const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);

const amountInUsd = computed(() => {
  if (!token.value) return "0";
  return toBN(token.value.price || 0).times(amount.value || "0").toFixed()
});

const loading = ref(false);

const { handleSubmit, errors, meta, resetForm, validate } = useForm({
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
      .test("is-address", "Incorrect address", (value) => {
        return value ? isAddress(value) : true;
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
    loading.value ||
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
      to: address.value,
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
        address.value,
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

const { data, pending, error } = useEstimatedFee(tx, {
  chainId: props.chainId,
});

const onSubmit = handleSubmit(async () => {
  if (!token.value) {
    return;
  }

  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(634);

    const metadata = encodeTransferMetadata({
      token: token.value.address,
      amount: toWei(amount.value, token.value.decimals),
      receiver: address.value,
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

    console.log(transactionHash);

    logActionToSlack({
      message: `${formatDecimal(amount.value)} ${formatSymbol(
        token.value?.symbol
      )} to ${address.value}`,
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
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: err,
      action: "send",
      type: "error",
      account: account.value,
    });
  }

  loading.value = false;
});
</script>

<template>
  <form @submit="onSubmit" class="text-center flex gap-7.5 flex-col">
    <div class="relative flex mx-auto h-10 w-10 rounded-full flex-shrink-0">
      <img
        width="40"
        height="40"
        class="h-10 w-10 rounded-[inherit]"
        :src="token.logoURI"
        :onerror="onImageError"
      />
    </div>

    <div class="flex flex-col justify-center gap-[15px] items-center">
      <h2>
        {{ token.name }}
        <span class="uppercase text-lg"> ({{ token.symbol }}) </span>
      </h2>

      <div
        class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="token.chainId" />
        <span class="text-xs text-slate-400 leading-5">{{
          chainIdToName(token.chainId)
        }}</span>
      </div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5 flex flex-col">
        <div class="flex justify-between items-center">
          <span class="text-sm">Amount</span>
          <span class="uppercase text-sm"
            >{{ formatDecimal(token.balance) }} {{ token.symbol }}</span
          >
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
         <span class="text-slate-400 text-sm text-left font-semibold"> {{ formatUsd(amountInUsd) }}</span>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Address To</span>
        </div>

        <CommonInput
          :error-message="addressMeta.dirty ? errors['address'] : ''"
          name="address"
          placeholder="Enter Address"
          v-model="address"
        >
          <template #suffix>
            <button v-tippy="{ content: 'Paste from clipboard', trigger: 'mouseenter' }" type="button" @click="pasteAddress">
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

        <div
          class="dark:bg-gray-850 !mt-5 bg-slate-50 px-3 py-2 flex space-x-2 rounded-[20px]"
        >
          <ChainLogo class="w-5 h-5" :chain="token.chainId" />
          <span class="text-xs font-medium leading-5">
            Sending on the {{ chainIdToName(token.chainId) }} network
          </span>
        </div>
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
      :loading="loading || pending"
      class="justify-center w-full"
      size="lg"
    >
      Send
    </CommonButton>
  </form>
</template>
