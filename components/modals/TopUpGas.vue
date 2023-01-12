<script setup lang="ts">
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import { Erc20__factory } from "~~/contracts";
import { storeToRefs } from "pinia";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import { toChecksumAddress } from "@walletconnect/utils";

const { library, account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction } = useAvocadoSafe();
const { tokenBalances } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler()
const { closeModal } = useModal()

const { gasBalance } = storeToRefs(useSafe());
const { fetchGasBalance } = useSafe()
const address = "0x6422F84a2bd26FaEd5ff4Ec37d836Bca2bC86056";

const chainUSDCAddresses: any = {
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  100: "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
  56: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
};

const networks = Object.keys(chainUSDCAddresses).map((chainId) => ({
  name: chainIdToName(chainId),
  chainId,
}));


const claimLoading = ref(false);
const provider = getRpcProvider(75);

const { data, execute } = useAsyncData('airDrop', async () => {
  const resp = await provider.send(
      "api_hasAirdrop",
      [account.value]
  );
  await fetchGasBalance()
  return resp
}, {
  watch: [account]
})

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required()
      .test("max-amount", "Insufficient balance", (value: any) => {
        const amount = toBN(value);
        const balance = toBN(token.value?.balance || 0);

        return amount.gt(0) && amount.lte(balance);
      }),
    chainId: yup.number().integer().required(),
  }),
});

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: chainId } = useField<number>(
  "chainId",
  {},
  { initialValue: 137 }
);

// TODO:
const token = computed(
  () =>
    tokenBalances.value.find(
      (t) =>
        t.chainId === String(chainId.value) &&
        toChecksumAddress(t.address) ===
          toChecksumAddress(chainUSDCAddresses[chainId.value])
    )!
);

const setMax = () => {
  amount.value = token.value!.balance;
};

const loading = ref(false);
const sendingDisabled = computed(
  () =>
    !token.value ||
    !address ||
    !account.value ||
    loading.value ||
    !meta.value.valid
);

const claim = async () => {
  try {
    claimLoading.value = true;
    const data = await provider.send(
      "api_claimAirdrop",
      [account.value]
    );

    if(data) {
      openSnackbar({
        message: 'Claimed successfully',
        type: "success",
      });
    }

    execute()

  } catch (e: any) {
    console.log(e);
    openSnackbar({
      message: "Something went wrong",
      type: "error",
    });
  } finally {
    claimLoading.value = false;
  }
};

const onSubmit = handleSubmit(async () => {
  if (!token.value) {
    return;
  }

  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(75);

    const transferAmount = toBN(amount.value)
      .times(10 ** token.value.decimals)
      .toFixed(0);

    let tx = {
      from: account.value,
      to: address,
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
        address,
        transferAmount
      );

      tx.data = data!;
      tx.to = token.value.address;
    }

    let transactionHash = await sendTransaction({
      ...tx,
      chainId: chainId.value,
    });

    closeModal()

    showPendingTransactionModal(transactionHash, chainId.value, 'topUpGas');

    resetForm();
  } catch (e: any) {
    console.log(e);
    openSnackbar({
      message: parseTransactionError(e),
      type: "error",
    });
  }

  loading.value = false;
});
</script>

<template>
  <form @submit="onSubmit" class="space-y-7.5 text-center">
    <div
      class="flex items-center mx-auto justify-center h-10 w-10 rounded-full dark:bg-slate-800 bg-slate-100"
    >
      <GasSVG class="text-slate-900 dark:text-white" />
    </div>
    <div class="flex gap-4 flex-col">
      <h1 class="text-lg leading-5">Gas Balance</h1>
      <h2 class="text-xs text-slate-400 leading-5 font-medium">
        Top up your gas balance to trigger transactions.
      </h2>
      <a
        href="https://help.avocado.link/en/getting-started/topping-up-gas-on-avocado"
        target="blank"
        rel="noopener noreferrer"
        class="text-sm text-center justify-center font-medium inline-flex gap-2.5 text-blue-500"
      >
        What’s happening here?
        <LinkSVG />
      </a>
    </div>
    <span
      class="whitespace-nowrap block px-5 py-3 ring-2 dark:ring-slate-700 ring-slate-200 rounded-[30px] w-fit leading-5 mx-auto"
    >
      {{ formatDecimal(gasBalance, 2) }} USDC
    </span>
    <CommonButton :loading="claimLoading" @click="claim()" v-if="data?.id" class="flex text-sm items-center gap-2">
       {{ data.message }}
    </CommonButton>
    <div class="space-y-5">
      <div class="flex flex-col gap-2.5">
        <span class="text-left leading-5">Network</span>
        <CommonSelect
          v-model="chainId"
          labelKey="name"
          valueKey="chainId"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center leading-5">
          <span>Amount</span>
          <span class="uppercase"
            >{{ token?.balance }} {{ token?.symbol }}</span
          >
        </div>
        <CommonInput
          min="0.000001"
          type="number"
          step="0.000001"
          inputmode="decimal"
          :error-message="amountMeta.dirty ? errors['amount'] : ''"
          name="amount"
          placeholder="Enter amount"
          v-model="amount"
        >
          <template #suffix>
            <button
              type="button"
              class="absolute top-0 bottom-0 right-0 mr-5 text-sm text-blue-500 hover:text-blue-500"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
      </div>
    </div>

    <CommonButton
      type="submit"
      :disabled="sendingDisabled"
      :loading="loading"
      class="justify-center w-full"
      size="lg"
    >
      Add Gas
    </CommonButton>
  </form>
</template>
