<script lang="ts" setup>
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import { RPC_URLS } from "~~/connectors";
import { useField, useForm } from "vee-validate";

const emit = defineEmits(["destroy"]);

const props = defineProps<{
  name: string;
}>();

const { contacts } = useContacts();
const { safeAddress } = useAvocadoSafe();

const {
  handleSubmit,
  isSubmitting,
  errors,
  meta,
  resetForm,
  validate,
  values,
} = useForm({
  validationSchema: yup.object({
    contactName: yup.string().required(""),
    // chainId: yup.string().required(""),
    // address: yup
    //   .string()
    //   .required("")
    //   .test("is-valid-address", "Incorrect address", (value) => {
    //     return value ? isAddress(value || "") : true;
    //   }),
  }),
});

const { value: chainId } = useField<string>("chainId", undefined, {
  initialValue: "1",
});
const {
  value: contactName,
  meta: contactNameMeta,
  setValue: setContactName,
} = useField<string>("contactName");
const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
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

const disabled = computed(() => !meta.value.valid || isSubmitting.value);

const onSubmit = handleSubmit(() => {
  console.log(addressMeta.dirty, errors);

  const _contact = {
    name: contactName.value,
    chainId: chainId.value,
    address: address.value,
  };
  if (contacts.value[safeAddress.value]) {
    contacts.value[safeAddress.value].push(_contact);
  } else {
    contacts.value[safeAddress.value] = [_contact];
  }

  emit("destroy");
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
  if (props.name) {
    setContactName(props.name);
  }
});
</script>

<template>
  <form @submit="onSubmit">
    {{ errors }}
    {{ values }}
    <h1 class="text-lg text-center leading-5 mb-7.5">Create Contact</h1>
    <div class="flex flex-col gap-5 mb-7.5">
      <div>
        <p class="mb-2.5 text-sm">Name</p>
        <CommonInput
          autofocus
          name="contactName"
          placeholder="Enter Name"
          v-model="contactName"
        />
      </div>
      <div>
        <p class="mb-2.5 text-sm">Address</p>
        <CommonInput
          :error-message="addressMeta.dirty ? errors['address'] : ''"
          name="address"
          placeholder="Enter Address"
          v-model="address"
        >
          <template #suffix>
            <button type="button" @click="pasteAddress">
              <ClipboardSVG />
            </button>
          </template>
        </CommonInput>
      </div>
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
      <!-- <CommonNotification
        v-if="error"
        type="warning"
        text="Contact already exists"
      /> -->
    </div>
    <CommonButton
      type="submit"
      size="lg"
      class="w-full items-center justify-center"
    >
      Save
    </CommonButton>
  </form>
</template>
