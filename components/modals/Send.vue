<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";

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
const { sendTransaction } = useAvocadoSafe();
const { tokenBalances } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler()
const { closeModal } = useModal()


const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);
const loading = ref(false);

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required("")
      .test('min-amount', '', (value) => {
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
      .required()
      .test("is-address", "Incorrect address", (value) => {
        return isAddress(value);
      }),
  }),
});

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: address, meta: addressMeta } = useField<string>("address");

const setMax = () => {
  amount.value = token.value!.balance;
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
  () => !token.value || loading.value || !meta.value.valid
);

const onSubmit = handleSubmit(async () => {
  if (!token.value) {
    return;
  }

  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(634);

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

    let transactionHash = await sendTransaction({
      ...tx,
      chainId: Number(props.chainId),
    });

    console.log(transactionHash);

    resetForm();
    closeModal()

    showPendingTransactionModal(transactionHash, props.chainId, 'send');
  } catch (e: any) {

    openSnackbar({
      message: parseTransactionError(e),
      type: "error",
    });
  }

  loading.value = false;
});
</script>

<template>
  <form @submit="onSubmit" class="text-center flex gap-7.5 flex-col">
    <div
      class="relative flex mx-auto h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
    >
      <img
        :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
        onerror="this.onerror=null; this.remove();"
      />
    </div>

    <div class="flex flex-col justify-center gap-[15px] items-center">
      <h2>{{ token.name }} 
        <span class="uppercase">
        ({{token.symbol }})
      </span>
    </h2>

      <div
        class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="token.chainId" />
        <span class="text-xs text-slate-400 leading-5"
          >{{ chainIdToName(token.chainId) }}</span
        >
      </div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Amount</span>
          <span class="uppercase">{{ token.balance }} {{ token.symbol }}</span>
        </div>
        <CommonInput
          type="numeric"
          :error-message="amountMeta.dirty ? errors['amount'] : ''"
          name="amount"
          placeholder="Enter amount"
          v-model="amount"
        >
          <template #suffix>
            <button type="button" class="text-blue-500 hover:text-blue-500" @click="setMax">
              MAX
            </button>
          </template>
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Address To</span>
        </div>

        <CommonInput
          :error-message="addressMeta.dirty ? errors['address'] : ''"
          name="address"
          placeholder="Enter Address"
          v-model="address"
        >
          <template #suffix>
            <button type="button" @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>

        <p class="text-slate-400 mt-2.5 text-xs font-medium text-left">
          Sending on the {{ chainIdToName(props.chainId) }} Network
        </p>
      </div>
    </div>

    <CommonButton
      type="submit"
      :disabled="sendingDisabled"
      :loading="loading"
      class="justify-center w-full"
      size="lg"
    >
      Send
    </CommonButton>
  </form>
</template>
