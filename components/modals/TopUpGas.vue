<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import { storeToRefs } from "pinia";
import GasSVG from "~/assets/images/icons/gas.svg?component";

const { library, account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction } = useAvocadoSafe();
const { tokenBalances } = useAvocadoSafe();

const { gasBalance } = storeToRefs(useSafe());
const address = "0x6422F84a2bd26FaEd5ff4Ec37d836Bca2bC86056";

const chainId = ref(137);

const networks = ref([
  {
    name: "Polygon",
    chainId: 137,
  },
  {
    name: "Optimism",
    chainId: 10,
  },
  {
    name: "Arbitrum",
    chainId: 42161,
  },
]);

const chainUSDCAddresses: any = {
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
}

// TODO:
const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === String(chainId.value) && t.address ===  chainUSDCAddresses[chainId.value] 
    )!
);
const amount = ref("");

const setMax = () => {
  amount.value = token.value!.balance;
};

const loading = ref(false);
const sendingDisabled = computed(
  () => !token.value || !address || !account.value || loading.value
);

const modal = ref();

const send = async () => {
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
      waitForConfirmation: false,
    });

    console.log(transactionHash);

    // notify({
    //   message: `${amount.value} ${token.value.symbol
    //     } sent to ${address.value}`,
    // });
    // address = "";
    amount.value = "";
    modal.value?.cancel();

    showPendingTransactionModal(transactionHash, chainId.value);
  } catch (e: any) {
    try {
      notify({
        type: "error",
        message: JSON.parse(e.body).error.message,
      });
    } catch {
      notify({
        type: "error",
        message: e.message,
      });
    }
  }

  loading.value = false;
};
</script>

<template>
  <div class="space-y-[30px] text-center">
    <div
      class="flex items-center mx-auto justify-center h-10 w-10 rounded-full bg-slate-800"
    >
      <GasSVG class="text-white" />
    </div>
    <div class="flex gap-4 flex-col">
      <h1 class="text-lg leading-5">Gas Balance</h1>
      <h2 class="text-xs text-slate-400 leading-5 font-medium">
        Top-up balance for paying for transactions <br />
        gas fees.
      </h2>
      <span
        class="whitespace-nowrap px-5 py-3 bg-slate-750 rounded-[30px] w-fit leading-5 mx-auto"
      >
        {{ formatDecimal(gasBalance, 2) }} USDC</span
      >
    </div>
    <div class="space-y-5">
        <CommonSelect
          v-model="chainId"
          labelKey="name"
          valueKey="chainId"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{value}">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
        
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Amount</span>
          <span>{{ token?.balance }} {{ token?.symbol }}</span>
        </div>
        <CommonInput placeholder="Enter amount" v-model="amount">
          <template #suffix>
            <button
              class="absolute top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
      </div>
    </div>

    <CommonButton
      :disabled="sendingDisabled"
      :loading="loading"
      @click="send"
      class="justify-center w-full"
      size="lg"
    >
      Add Gas
    </CommonButton>
  </div>
</template>
