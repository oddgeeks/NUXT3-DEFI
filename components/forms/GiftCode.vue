<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";

const { account } = useWeb3();
defineEmits(["close"]);

const {
  handleSubmit,
  meta: formMeta,
  errors,
} = useForm({
  validationSchema: yup.object({
    "gift-code": yup
      .string()
      .required("")
      .test("is-valid", "Gift code is invalid", (value) => {
        // TODO: check if gift code is valid
        return value ? value.length === 6 : true;
      }),
  }),
});

const { value, meta: valueMeta } = useField<string>("gift-code");

const sendingDisabled = computed(
  () => !account.value || !formMeta.value.valid
);

const onSubmit = handleSubmit(async () => {
  // TODO: send gift code
});
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-7.5">
    <label for="input-gift-code">
      <div class="flex justify-between mb-2.5">
        <span class="text-sm">Gift code</span>
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
        v-model="value"
        :error-message="valueMeta.dirty ? errors['gift-code'] : ''"
        autofocus
        placeholder="Enter Gift Code"
        name="gift-code"
      />
    </label>
    <CommonButton
      :disabled="sendingDisabled"
      type="submit"
      class="justify-center w-full"
      size="lg"
    >
      Claim Gas
    </CommonButton>
  </form>
</template>
