<script lang="ts" setup>
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";
import ClipboardSVG from "~/assets/images/icons/clipboard.svg?component";
import { RPC_URLS } from "~~/connectors";
import { useField, useForm } from "vee-validate";

const emit = defineEmits(["destroy", "reject"]);

const props = defineProps<{
  name: string;
}>();

const { contacts } = useContacts();
const { safeAddress } = useAvocadoSafe();

const { value: chainId } = useField<string>("chainId", undefined, {
  initialValue: "1",
});
const { value: name, setValue: setName } = useField<string>("name");
const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
} = useField<string>("address");

const { handleSubmit, isSubmitting, errors, meta, resetForm, validate } =
  useForm({
    validationSchema: yup.object({
      // name: yup.string().required(""),
      // chainId: yup.string().required(""),
      // address: yup
      //   .string()
      //   .required("")
      //   .test("is-valid-address", "Incorrect address", (value) => {
      //     return value ? isAddress(value || "") : true;
      //   }),
      // .test(
      //   "duplicate-address",
      //   "Contact already added",
      //   (value, { parent }) => {
      //     if (!isAddress(value || "")) return true;
      //     return true;
      //     // if (!contacts.value[chainId]) return true;
      //     // return (
      //     //   contacts.value[chainId].findIndex(
      //     //     (contact) =>
      //     //       contact.address.toLowerCase() === value.toLowerCase()
      //     //   ) === -1
      //     // );
      //   }
      // ),
    }),
  });

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
  if (contacts.value[safeAddress.value]) {
    contacts.value[safeAddress.value].push({
      name: name.value,
      chainId: chainId.value,
      address: address.value,
    });
  } else {
    contacts.value[safeAddress.value] = [
      {
        name: name.value,
        chainId: chainId.value,
        address: address.value,
      },
    ];
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
    setName(props.name);
  }
});
</script>

<template>
  <form @submit="onSubmit">
    <h1 class="text-lg text-center leading-5 mb-7.5">Create Contact</h1>
    <div class="flex flex-col gap-5 mb-7.5">
      <div>
        <p class="mb-2.5 text-sm">Name</p>
        <CommonInput
          autofocus
          name="name"
          placeholder="Enter Name"
          v-model="name"
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
