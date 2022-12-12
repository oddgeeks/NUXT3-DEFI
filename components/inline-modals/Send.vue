<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { Erc20__factory } from "~~/contracts";
import PendingTransaction from "../modals/PendingTransaction.vue";

const props = defineProps({
  address: {
    type: String,
    required: true
  },
  chainId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
});

const { library, account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction } = useAvocadoSafe();
const { tokenBalances } = useAvocadoSafe();
const address = ref<string>("");
const token = computed(() => tokenBalances.value.find(t => t.chainId === props.chainId && t.address === props.address)!)
const amount = ref("");

const setMax = () => {
  amount.value = token.value!.balance;
};

const pasteAddress = async () => {
  address.value = await navigator.clipboard.readText()
}

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
      tx.value = transferAmount
    } else {
      const contract = Erc20__factory.connect(token.value.address, library.value)

      const { data } = await contract.populateTransaction.transfer(address.value, transferAmount)

      tx.data = data!
      tx.to = token.value.address
    }

    let transactionHash = await sendTransaction({
      ...tx,
      chainId: props.chainId,
      waitForConfirmation: false
    })

    console.log(transactionHash)

    notify({
      message: `${amount.value} ${token.value.symbol
        } sent to ${address.value}`,
    });
    address.value = "";
    amount.value = "";
    modal.value?.cancel();

    showPendingTransactionModal(transactionHash, props.chainId)

  } catch (e: any) {
    console.log(e)
    notify({
      type: "error",
      message: e.message,
    });
  }

  loading.value = false;
};
</script>

<template>
  <button v-if="disabled" class="
            shadow
            py-2
            px-7
            inline-flex
            justify-center
            items-center
            rounded-[20px]
            bg-slate-800
            text-slate-500 text-sm
            font-semibold
          ">
    Send
  </button>

  <CommonInlineModal v-else ref="modal" containerClass="rounded-[20px] md:max-w-md">
    <template #reveal="{ openModal }">
      <slot :openModal="openModal">
        <button @click="openModal" class="
            shadow
            py-2
            px-7
            inline-flex
            justify-center
            items-center
            rounded-[20px]
            bg-blue-500
            hover:bg-blue-600
            text-white text-sm
            font-semibold
          ">
          Send
        </button>
      </slot>
    </template>
    <template v-slot="{ closeModal }">
      <div class="relative bg-[#111827] rounded-[20px] px-10 pt-2 pb-12 space-y-8 text-center w-full max-w-[460px]">
        <button class="absolute top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" rx="15" fill="#1E293B" />
            <path d="M18.5 11.5L11.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M11.5 11.5L18.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>

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

            <div class="relative">
              <input type="text"
                class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
                placeholder="Enter amount" v-model="amount" />

              <button class="absolute top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
                @click="setMax">MAX</button>
            </div>

          </div>

          <div class="space-y-2.5">
            <div class="flex justify-between items-center">
              <span>Address To</span>
            </div>

            <div class="relative">
              <input type="text"
                class="peer bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
                placeholder="Enter Address" v-model="address" />

              <button
                class="absolute z-10 bg-slate-800 peer-focus:bg-gray-850  top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
                @click="pasteAddress">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3.59528 15.0092C3.75544 16.6101 5.02628 17.9091 6.62344 18.1041C7.82371 18.2506 9.05632 18.377 10.3132 18.377C11.57 18.377 12.8026 18.2506 14.0029 18.1041C15.6 17.9091 16.8709 16.6101 17.031 15.0092C17.1695 13.6251 17.2923 12.2007 17.2923 10.7466C17.2923 9.29243 17.1695 7.86804 17.031 6.48398C16.8709 4.88293 15.6 3.58403 14.0029 3.38906C12.8026 3.24253 11.57 3.11621 10.3132 3.11621C9.05632 3.11621 7.82371 3.24253 6.62344 3.38906C5.02628 3.58403 3.75544 4.88293 3.59528 6.48398C3.45683 7.86804 3.33398 9.29243 3.33398 10.7466C3.33398 12.2007 3.45683 13.6251 3.59528 15.0092Z"
                    stroke="#94A3B8" stroke-width="2" />
                  <path
                    d="M6.64062 3.28556C6.64062 4.46516 7.76321 5.35188 8.94099 5.41733C9.39091 5.44231 9.84856 5.46005 10.3125 5.46005C10.7764 5.46005 11.2341 5.44231 11.684 5.41733C12.8618 5.35188 13.9844 4.46516 13.9844 3.28556C13.9844 2.10596 12.8618 1.21924 11.684 1.1538C11.2341 1.1288 10.7764 1.11108 10.3125 1.11108C9.84856 1.11108 9.39091 1.1288 8.94099 1.1538C7.76321 1.21924 6.64062 2.10596 6.64062 3.28556Z"
                    fill="#1E293B" stroke="#94A3B8" stroke-width="2" />
                  <path d="M12.1905 9.44434H8.69531" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
                  <path d="M12.1905 13.3799H8.69531" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <p class="text-slate-400 mt-2.5 text-xs font-medium text-left">Enter valid address existing on the Arbitrum
              Network.</p>
          </div>
        </div>


        <div class="flex">
          <button :disabled="sendingDisabled" :loading="loading" @click="send"
            class="cursor-pointer bg-blue-500 hover:bg-blue-600 px-4 py-2 capitalize w-full shadow-md rounded-[15px] flex justify-center items-center space-x-2"
            :class="{
              'cursor-not-allowed': loading,
              'bg-blue-400': loading,
            }">
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>

            <span>{{ loading ? "Sending" : "Send" }}</span>
          </button>
        </div>
      </div>
    </template>
  </CommonInlineModal>
</template>
