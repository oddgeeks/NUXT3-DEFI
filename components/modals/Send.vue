<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";

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
const address = ref<string>("");
const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);
const amount = ref("");

const setMax = () => {
  amount.value = token.value!.balance;
};

const pasteAddress = async () => {
  address.value = await navigator.clipboard.readText();
};

const loading = ref(false);
const sendingDisabled = computed(
  () => !token.value || !address.value || !account.value || loading.value
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
    await switchNetworkByChainId(420);

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
      chainId: props.chainId,
      waitForConfirmation: false,
    });

    console.log(transactionHash);

    // notify({
    //   message: `${amount.value} ${token.value.symbol
    //     } sent to ${address.value}`,
    // });
    address.value = "";
    amount.value = "";
    modal.value?.cancel();

    showPendingTransactionModal(transactionHash, props.chainId);
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
  <div class="space-y-8">
    <div class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0">
      <img :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
        onerror="this.onerror=null; this.remove();" />
    </div>

    <div>
      <h2>{{ token.name }}</h2>

      <div class="bg-gray-850 mt-4 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]">
        <ChainLogo class="w-5 h-5" :chain="token.chainId" />
        <span class="text-xs text-slate-400 leading-5">{{ chainIdToName(token.chainId) }} Network</span>
      </div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Amount</span>
          <span>{{ token.balance }} {{ token.symbol }}</span>
        </div>
        <CommonInput placeholder="Enter amount" v-model="amount">
          <template #suffix>
            <button class="absolute top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500" @click="setMax">
              MAX
            </button>
          </template>
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Address To</span>
        </div>

        <CommonInput input-classes="peer" placeholder="Enter Address" v-model="address">
          <template #suffix>
            <button
              class="absolute z-10 bg-slate-800 peer-focus:bg-gray-850 top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
              @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>

        <p class="text-slate-400 mt-2.5 text-xs font-medium text-left">
          Enter valid address existing on the
          {{ chainIdToName(props.chainId) }} Network.
        </p>
      </div>
    </div>

    <CommonButton :disabled="sendingDisabled" :loading="loading" @click="send" class="justify-center w-full" size="lg">
      Send
    </CommonButton>
  </div>
</template>
