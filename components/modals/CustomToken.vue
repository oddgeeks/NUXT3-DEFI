<script lang="ts" setup>
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import { IToken } from "~~/stores/tokens";
import { Erc20__factory } from "~~/contracts";
import { RPC_URLS } from "~~/connectors";
import { useField, useForm } from "vee-validate";
import { storeToRefs } from "pinia";

const props = defineProps<{
  address: string;
}>();

const { handleAddToken } = useTokens();
const { tokens } = storeToRefs(useTokens());
const { fetchBalances } = useSafe();

const balance = ref("0");

const { handleSubmit, isSubmitting, errors, meta, resetForm, validate } =
  useForm({
    validationSchema: yup.object({
      chainId: yup.string().required(""),
      address: yup
        .string()
        .required("")
        .test("is-valid-address", "Incorrect address", (value) => {
          return value ? isAddress(value || "") : true;
        })
        .test(
          "duplicate-address",
          "Token already added",
          (value, { parent }) => {
            if (!isAddress(value || "")) return true;

            return !tokens.value.some((t) => {
              return (
                t.address.toLowerCase() === value?.toLowerCase() &&
                t.chainId == parent.chainId
              );
            });
          }
        ),
    }),
  });

const { value: chainId } = useField<string>("chainId", undefined, {
  initialValue: "1",
});
const {
  value: address,
  meta: addressMeta,
  setValue,
} = useField<string>("address");

const supportedChains = computed(() =>
  Object.keys(RPC_URLS)
    .filter((i) => i !== String(avoChainId))
    .map((chainId) => {
      return {
        id: chainId,
        name: chainIdToName(chainId),
      };
    })
);

const {
  data: token,
  pending,
  error,
} = useAsyncData(
  "custom-token",
  async () => {
    const { valid } = await validate();

    if (valid) {
      const contract = Erc20__factory.connect(
        address.value,
        getRpcProvider(chainId.value)
      );

      const symbol = await contract.symbol();
      const name = await contract.name();
      const decimals = await contract.decimals();

      const data = await fetchBalances();

      const tokenBalance = data?.find(
        (i: IToken) =>
          i.address.toLowerCase() === address.value.toLowerCase() &&
          i.chainId == chainId.value
      );

      if (tokenBalance) {
        balance.value = tokenBalance.balance;
      }

      return {
        address: address.value,
        chainId: chainId.value,
        symbol,
        name,
        decimals,
        coingeckoId: "",
        logoURI: "",
        price: 0,
        sparklinePrice7d: [],
      } as IToken;
    }
  },
  {
    watch: [address, chainId],
  }
);

const loading = computed(
  () => (isSubmitting.value || pending.value) && meta.value.valid
);

const disabled = computed(
  () => !meta.value.valid || isSubmitting.value || !token.value || pending.value
);

const onSubmit = handleSubmit(async () => {
  if (!token.value) return;

  handleAddToken(token.value);

  openSnackbar({
    message: `${token.value?.name} added successfully.`,
    type: "success",
    timeout: 5000,
  });

  refreshNuxtData("custom-tokens");
  resetForm({
    values: {
      chainId: "1",
      address: "",
    },
  });
});

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

onMounted(() => {
  if (props.address) {
    setValue(props.address);
  }
});

onUnmounted(() => {
  clearNuxtData("custom-token");
});
</script>

<template>
  <form @submit="onSubmit">
    <h1 class="text-lg text-center leading-5 mb-7.5">Custom Token</h1>
    <div class="flex flex-col gap-5 mb-7.5">
      <div>
        <p class="mb-2.5 text-sm">Network</p>
        <CommonSelect
          class="w-full"
          v-model="chainId"
          value-key="id"
          label-key="name"
          :options="supportedChains"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6 shrink-0" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6 shrink-0" :chain="value" />
          </template>
        </CommonSelect>
      </div>
      <div>
        <p class="mb-2.5 text-sm">Token Address</p>
        <CommonInput
          autofocus
          :error-message="addressMeta.dirty ? errors['address'] : ''"
          name="address"
          placeholder="Enter Address"
          v-model.trim="address"
        >
          <template #suffix>
            <button type="button" @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>
      </div>
      <CommonNotification
        v-if="error"
        type="warning"
        text="Token not found, try changing the network."
      />
    </div>
    <div class="flex justify-between items-center mb-7.5" v-if="token">
      <div class="text-slate-400">
        <p>{{ token.name }}</p>
        <p class="text-sm font-medium">{{ balance }} {{ token.symbol }}</p>
      </div>
      <div
        class="dark:bg-gray-850 text-sm bg-slate-50 px-4 py-2.5 rounded-2xl items-center justify-center text-slate-400"
      >
        Decimals {{ token.decimals }}
      </div>
    </div>
    <CommonButton
      type="submit"
      :loading="loading"
      :disabled="disabled"
      size="lg"
      class="w-full items-center justify-center"
    >
      Add Token
    </CommonButton>
  </form>
</template>
