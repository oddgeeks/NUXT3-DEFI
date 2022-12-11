<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { Erc20__factory } from "~~/contracts";

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
      waitForConfirmation: true
    })

    console.log(transactionHash)

    notify({
      message: `${amount.value} ${token.value.symbol
        } sent to ${address.value}`,
    });
    address.value = "";
    amount.value = "";
    modal.value?.cancel();
  } catch (e: any) {
    console.log(e)
    notify({
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

  <CommonModal v-else ref="modal" containerClass="rounded-[20px] md:max-w-md">
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
      <div class="bg-gray-850 rounded-[20px] p-5">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-lg font-medium">Send {{ token.name }}</h1>
          <button @click="closeModal" aria-label="Close modal">
            <SVGX class="w-4 h-4" />
          </button>
        </div>
        <div></div>
        <div class="space-y-4">
          <div>
            <label class="block text-md font-medium">
              From
            </label>
            <div class="
                relative
                mt-1
                flex flex-col
                w-full
                border border-gray-700
                rounded-[15px] overflow-hidden
              ">
              <div class="flex">
                <div class="
                    px-4
                    py-3
                    flex flex-row
                    items-center
                    font-semibold
                    text-sm text-slate-400
                    w-3/8
                  ">
                  {{ chainIdToName(token.chainId) }}
                </div>
                <div class="
                    p-4
                    flex
                    justify-between
                    items-center
                    font-semibold
                    text-gray-400 text-sm
                    w-5/8
                    border-l border-gray-700
                  ">
                  Balance:
                  <span class="text-white ml-2">{{ token.balance }} {{ token.symbol }}</span>
                </div>
              </div>
              <div class="w-full flex border-t border-gray-700">
                <div class="relative flex font-semibold w-6/8">
                  <input type="number" id="amount" v-model="amount" class="
                  bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12  w-full

                    " placeholder="0" />
                  <button v-on:click="setMax" class="
                      absolute
                      flex
                      justify-center
                      items-center
                      right-5
                      top-4
                      font-semibold
                      text-blue-500
                    ">
                    MAX
                  </button>
                </div>
                <div class="
                    w-2/8
                    flex
                    items-center
                    justify-between
                    px-4
                    font-semibold
                    border-l border-gray-700
                    rounded-br-md
                  ">
                  <div class="flex items-center text-sm">
                    <!--- <img :src="token.icon" class="w-6 h-6 mr-2" /> -->
                    {{ token.symbol }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative">
            <label class="block text-md font-medium"> To </label>
            <input type="text" id="address" v-model="address" class="
                mt-1
                bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full
              " placeholder="0xwallet" />
            <p class="mt-2 text-xs font-semibold text-gray-500" id="email-description">
              Enter valid address existing on the {{ chainIdToName(token.chainId) }} Network.
            </p>
          </div>
        </div>
        <div class="flex mt-4">
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
  </CommonModal>
</template>
