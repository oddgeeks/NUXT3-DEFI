<script setup lang="ts">
import { useField } from 'vee-validate'
import ContactSVG from '~/assets/images/icons/contact.svg'

const { data, stepBack, stepForward, actualAddress, toAvailableNetworks } = useSend()

const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
  validate,
  errorMessage,
  errors,
} = useField<string>('address', undefined, {
  initialValue: data.value.address ? data.value.address : undefined,
})

const disabled = computed(() => {
  return !actualAddress.value || errors.value.length > 0
})

async function handleSelectContact() {
  const result = await openSelectContactModal()

  if (result.success) {
    const _contact = result.payload as IContact

    setAddress(_contact.address)
  }
}

function handleContinue() {
  data.value.address = address.value

  stepForward()
}

watch(() => data.value.toChainId, () => {
  validate()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-2.5">
      <span class="text-sm">Network</span>
      <CommonSelect
        v-model="data.toChainId"
        value-key="chainId"
        label-key="name"
        icon-key="icon"
        class="mt-[5px]"
        :options="toAvailableNetworks"
      >
        <template #button-prefix>
          <ChainLogo class="w-6 h-6" :chain="data.toChainId" />
        </template>
        <template #item-prefix="{ value }">
          <ChainLogo class="w-6 h-6" :chain="value" />
        </template>
      </CommonSelect>
    </div>
    <CommonInput
      v-model="address"
      autofocus
      :error-message="addressMeta.dirty ? errorMessage : ''"
      name="address"
      placeholder="Enter Address"
    >
      <template #suffix>
        <button
          v-tippy="{
            content: 'Select contact',
          }"
          type="button"
          class="ml-3"
          @click="handleSelectContact()"
        >
          <ContactSVG />
        </button>
      </template>
    </CommonInput>

    <div class="grid grid-cols-2 gap-5 mt-2.5">
      <CommonButton color="white" class="justify-center" size="lg" @click="stepBack">
        Back
      </CommonButton>
      <CommonButton class="justify-center" size="lg" :disabled="disabled" @click="handleContinue">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
