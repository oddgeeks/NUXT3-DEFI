<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { ethers } from "ethers";
import { storeToRefs } from "pinia";

const provider = getRpcProvider(634);

const { account } = useWeb3();
const { fetchGasBalance } = useSafe();
const { safeAddress } = storeToRefs(useSafe())
const emit = defineEmits(["close"]);

const {
  handleSubmit,
  isSubmitting,
  meta: formMeta,
  errors,
} = useForm({
  validationSchema: yup.object({
    "gift-code": yup.string().required(""),
  }),
});

const { value, meta: valueMeta, setErrors } = useField<string>("gift-code");

const sendingDisabled = computed(
  () => !account.value || !formMeta.value.valid || isSubmitting.value
);

const onSubmit = handleSubmit(async () => {
  const browserProvider = new ethers.providers.Web3Provider(window.ethereum);

  const signer = browserProvider.getSigner();

  const message = `Avocado wants you to sign in with your web3 account ${account.value}

Action: Redeem code
Code: ${value.value}
URI: https://avocado.link
Nonce: {{NONCE}}
Issued At: ${new Date().toISOString()}`

  const airdropNonce = await provider.send("api_generateNonce", [
    account.value,
    message,
  ]);

  const redeemSignature = await signer.signMessage(
    message.replaceAll("{{NONCE}}", airdropNonce)
  );

   const success = await provider.send("api_claimGift", [
    value.value,
    redeemSignature,
    airdropNonce
   ])

  if (!success) {
    setErrors("Invalid redeem code.");
  } else {
    slack(`Redeemed (${value.value})
User: ${account.value}`);

    emit("close");

    openSnackbar({
      message: "Gas redeemed successfully!",
      type: "success",
      timeout: 3000,
    });

    fetchGasBalance();
  }
});
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-7.5">
    <label for="input-gift-code">
      <div class="flex justify-between mb-2.5">
        <span class="text-sm">Reedem code</span>
        <button
          @click="$emit('close')"
          type="button"
          class="h-5 w-5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
          aria-label="Gift Code"
        >
          <SVGX class="w-2.5 h-2.5" />
        </button>
      </div>
      <CommonInput
        v-model.trim="value"
        :error-message="valueMeta.dirty ? errors['gift-code'] : ''"
        autofocus
        placeholder="Enter Gift Code"
        name="gift-code"
      />
    </label>
    <CommonButton
      :disabled="sendingDisabled"
      :loading="isSubmitting"
      type="submit"
      class="justify-center w-full"
      size="lg"
    >
      Redeem Gas
    </CommonButton>
  </form>
</template>
