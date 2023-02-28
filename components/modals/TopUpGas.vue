<script setup lang="ts">
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import { Erc20__factory } from "~~/contracts";
import { storeToRefs } from "pinia";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import { toChecksumAddress } from "@walletconnect/utils";
import { ethers } from "ethers";

const emit = defineEmits(["destroy"]);

const { library, account, provider: web3Provider } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction, airDrop, tokenBalances, fetchAirDrop, safeAddress } =
  useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();
const [isGiftActive, toggleGift] = useToggle(false);

const { gasBalance } = storeToRefs(useSafe());
const { fetchGasBalance } = useSafe();
const address = "0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E";

const chainUSDCAddresses: any = {
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  100: "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
  56: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
};

const networks = computed(() =>
  Object.keys(chainUSDCAddresses)
    .map((chainId) => ({
      name: chainIdToName(chainId),
      chainId,
      balance: getUSDCByChainId(chainId)?.balance,
    }))
    .sort((a, b) => toBN(b.balance).minus(a.balance).toNumber())
);

const claimLoading = ref(false);
const provider = getRpcProvider(634);

const { handleSubmit, errors, meta, resetForm, validate, isSubmitting } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required("")
      .test("min-amount", "", (value) => {
        const amount = toBN(value);

        return value ? amount.gt(0) : true;
      })
      .test("max-amount", "Insufficient balance", (value: any) => {
        const amount = toBN(value);
        const balance = toBN(token.value?.balance || 0);

        return amount.gt(0) ? amount.lte(balance) : true;
      }),
    chainId: yup.number().integer().required(),
  }),
});

const { value: amount, meta: amountMeta } = useField<string>("amount");
const { value: chainId, setValue } = useField<number>(
  "chainId",
  {},
  { initialValue: 137 }
);

// TODO:
const token = computed(() => getUSDCByChainId(String(chainId.value)));

const getUSDCByChainId = (chainId: string) => {
  return tokenBalances.value.find(
    (t) =>
      t.chainId === chainId &&
      toChecksumAddress(t.address) ===
        toChecksumAddress(chainUSDCAddresses[chainId])
  )!;
};

const setMax = () => {
  amount.value = token.value!.balance;
};

const amountInWei = computed(() =>
  toBN(amount.value)
    .times(10 ** token.value.decimals)
    .toFixed(0)
);

const sendingDisabled = computed(
  () =>
    !token.value ||
    !address ||
    !account.value ||
    loading.value ||
    !meta.value.valid || 
    loading.value
);

const loading = computed(() => isSubmitting.value || pending.value)

const claim = async () => {
  try {
    claimLoading.value = true;

    const message = `Avocado wants you to sign in with your web3 account ${
      account.value
    }

Action: Claim 1 USDC airdrop
URI: https://avocado.instadapp.io
Nonce: {{NONCE}}
Issued At: ${new Date().toISOString()}`;

    const browserProvider = new ethers.providers.Web3Provider(window.ethereum);

    const signer = browserProvider.getSigner();

    const airdropNonce = await provider.send("api_generateNonce", [
      account.value,
      message,
    ]);

    const giftSignature = await signer.signMessage(
      message.replaceAll("{{NONCE}}", airdropNonce)
    );

    const data = await provider.send("api_claimAirdrop", [
      giftSignature,
      airdropNonce,
    ]);

    if (data) {
      logActionToSlack({
        action: "claim",
        account: account.value,
        message: "1 USDC",
      });

      openSnackbar({
        message: "Claimed successfully",
        type: "success",
      });
    }

    await fetchGasBalance();
    await fetchAirDrop();
  } catch (e: any) {
    const err = parseTransactionError(e);

    openSnackbar({
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: err,
      type: "error",
      action: "claim",
      account: account.value,
    });
  } finally {
    claimLoading.value = false;
  }
};

const { data: tx } = useAsyncData(
  async () => {
    const { valid } = await validate();
    if (!valid) return;

    let tx = {
      from: account.value,
      to: address,
      value: "0",
      data: "0x",
    };

    if (token.value.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      tx.value = amountInWei.value;
    } else {
      const contract = Erc20__factory.connect(
        token.value.address,
        library.value
      );

      const { data } = await contract.populateTransaction.transfer(
        address,
        amountInWei.value
      );

      tx.data = data!;
      tx.to = token.value.address;

      return tx
    }
  },
  {
    server: false,
    immediate: false,
    watch: [amountInWei, chainId],
  }
);

const { data, pending, error } = useEstimatedFee(tx, {
  chainId: String(chainId.value),
})

const onSubmit = handleSubmit(async () => {
  try {
    await switchNetworkByChainId(634);

    const metadata = encodeTopupMetadata({
      amount: amountInWei.value,
      token: token.value.address,
      onBehalf: safeAddress.value,
    });

    let transactionHash = await sendTransaction(
      {
        ...tx.value as any,
        chainId: chainId.value,
      },
      {
        metadata,
      }
    );

    logActionToSlack({
      action: "topup",
      message: `${amount.value} ${formatSymbol("usdc")}`,
      account: account.value,
      chainId: String(chainId.value),
      txHash: transactionHash,
    });

    emit("destroy");

    showPendingTransactionModal(transactionHash, chainId.value, "topUpGas");

    resetForm();
  } catch (e: any) {
    console.log(e);

    const err = parseTransactionError(e);
    openSnackbar({
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: err,
      type: "error",
      action: "topup",
      account: account.value,
    });
  }
});

onMounted(() => {
  const mostBalancedChain = networks.value[0]?.chainId;
  if (mostBalancedChain) {
    setValue(Number(mostBalancedChain));
  }
});
</script>

<template>
  <div class="space-y-7.5 text-center">
    <div
      class="flex items-center mx-auto justify-center h-10 w-10 rounded-full dark:bg-slate-800 bg-slate-100"
    >
      <GasSVG class="text-slate-900 dark:text-white" />
    </div>
    <div class="flex gap-4 flex-col">
      <h1 class="text-lg leading-5">Gas Reserve</h1>
      <h2 class="text-xs text-slate-400 leading-5 font-medium">
        You will be able to use this as gas on any supported chain. Note that
        you need to have USDC in your Avocado wallet to add gas.
      </h2>
      <a
        href="https://help.avocado.instadapp.io/en/getting-started/topping-up-gas-on-avocado"
        target="blank"
        rel="noopener noreferrer"
        class="text-sm text-center justify-center font-medium inline-flex gap-2.5 text-primary"
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
    <form v-if="!isGiftActive" @submit="onSubmit" class="space-y-5">
      <div class="flex flex-col gap-2.5">
        <span class="text-left leading-5">Network</span>
        <CommonSelect
          v-model="chainId"
          labelKey="name"
          valueKey="chainId"
          itemWrapperClasses="!items-baseline"
          :options="networks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
          <template #item="{ label, item }">
            <div class="flex flex-col gap-1 mb-auto">
              <span>{{ label }}</span>
              <span class="text-sm text-gray-400 font-medium">
                {{ formatDecimal(item.balance) }} USDC
              </span>
            </div>
          </template>
        </CommonSelect>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center leading-5">
          <span>Amount</span>
          <span class="uppercase"
            >{{ formatDecimal(token?.balance) }} {{ token?.symbol }}</span
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
              class="absolute top-0 bottom-0 right-0 mr-5 text-sm text-primary hover:text-primary"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
      </div>
     <EstimatedFee
        :chain-id="chainId"
        :loading="pending"
        :data="data"
        :error="error"
      />
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

    <FormsGiftCode @close="toggleGift()" v-else />

    <button
      v-if="!isGiftActive"
      @click="toggleGift()"
      type="button"
      class="text-xs text-primary !mt-3"
    >
      Redeem Code
    </button>
  </div>
</template>
