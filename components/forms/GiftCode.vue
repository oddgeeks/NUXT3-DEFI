<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";

const provider = getRpcProvider(634);

const { account } = useWeb3();
const { openSnackbar } = useModal()
const { fetchGasBalance } = useSafe();
const emit = defineEmits(["close"]);

const {
  handleSubmit,
  isSubmitting,
  meta: formMeta,
  errors,
} = useForm({
  validationSchema: yup.object({
    "gift-code": yup
      .string()
      .required("")
  }),
});

const { value, meta: valueMeta, setErrors } = useField<string>("gift-code");

const sendingDisabled = computed(
  () => !account.value || !formMeta.value.valid || isSubmitting.value
);

const onSubmit = handleSubmit(async () => {
  const success = await provider.send('api_claimGift', [
    account.value,
    value.value
  ])

  if (!success) {
    setErrors("Invalid redeem code.")
  } else {
    emit("close")

    openSnackbar({
      message: "Gas redeemed successfully!",
      type: "success",
      timeout: 3000
    })

    fetchGasBalance()
    
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
