<script setup lang="ts">
import { serialize } from 'error-serializer'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps<{
  mfaType: IMfa
}>()

const emit = defineEmits(['resolve', 'destroy'])

const phoneRegexp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const countriesWithKey = computed(() => countries.map(c => ({ ...c, key: c.iso2 + c.dialCode })))

const { selectedSafe } = storeToRefs(useSafe())
const { activateMfa } = useMfa()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

const { handleSubmit, meta, isSubmitting } = useForm({
  validationSchema: yup.object({
    email: yup.string().email().when('mfa', {
      is: 'email',
      then: yup.string().required(),
    }),
    phone: yup.string().when('mfa', {
      is: 'phone',
      then: yup.string().matches(phoneRegexp, 'Phone number is not valid').required(),
    }),
  }),
})
useField<Mfa>('mfa', undefined, {
  initialValue: props.mfaType.value,
})
const { value: email, errorMessage: emailErrorMessage } = useField('email')
const { value: phone, errorMessage: phoneErrorMessage } = useField('phone')
const { value: countryCode } = useField('countryCode', undefined, {
  initialValue: '',
})

const country = computed(() => {
  return countriesWithKey.value.find(c => c.key === countryCode.value)
})

const onSubmit = handleSubmit(async () => {
  const country = countriesWithKey.value.find(c => c.key === countryCode.value)

  const value = {
    phone: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      countryCode: country?.dialCode,
      phone: phone.value,
      mfaType: '',
      mfaCode: '',
    },
    email: {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      email: email.value,
      mfaType: '',
      mfaCode: '',
    },
  } as any

  const data = value[props.mfaType.value]

  try {
    await activateMfa(props.mfaType, data)

    emit('resolve', true)
  }
  catch (e: any) {
    const parsed = serialize(e)

    openSnackbar({
      type: 'error',
      message: parsed.message,
    })
  }
})

onMounted(async () => {
  const lookup: any = await $fetch('https://ipapi.co/json')

  const existingCode = countriesWithKey.value.find(c => c.key === `${lookup.country_code.toLowerCase()}${parseInt(lookup.country_calling_code)}`)?.key

  if (existingCode)
    countryCode.value = existingCode
})
</script>

<template>
  <div class="flex flex-col gap-5 p-7.5">
    <form class="flex flex-col gap-7.5" @submit="onSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-lg">
          {{ mfaType.title }}
        </h1>
        <h2 class="text-xs font-medium text-slate-400">
          {{ mfaType.description }}
        </h2>
      </div>
      <div v-if="mfaType.value === 'email'" class="flex flex-col gap-2.5">
        <label class="text-sm font-medium leading-5" for="input-email">Email</label>
        <CommonInput id="email" v-model="email" autofocus name="email" :error-message="emailErrorMessage" type="email" class="w-full" />
      </div>
      <div v-else-if="mfaType.value === 'phone'" class="flex flex-col gap-5">
        <div class="flex flex-col gap-2.5">
          <label class="text-sm font-medium leading-5" for="input-phone">Phone</label>
          <div class="flex w-full items-baseline">
            <CommonInput id="phone" v-model="phone" name="phone" autofocus placeholder="0000 0000" :error-message="phoneErrorMessage" container-classes="!px-0" class="w-full">
              <template #prefix>
                <CommonSelect v-model="countryCode" container-classes="!py-0 !bg-transparent !border-0 pr-1" list-classes="!w-[400%]" searchable label-key="name" value-key="key" :options="countriesWithKey">
                  <template #button-label>
                    <Flag v-if="country" class="h-5 w-5" :flag="country?.iso2.toUpperCase()" />
                  </template>
                  <template #item="{ item }">
                    <Flag v-if="item" class="h-5 w-5" :flag="item?.iso2.toUpperCase()" />
                    {{ item.name }}
                  </template>
                </CommonSelect>
                <span class="mr-1.5">
                  +{{ country?.dialCode }}
                </span>
              </template>
            </CommonInput>
          </div>
        </div>
      </div>
      <div class="flex justify-center gap-4">
        <CommonButton color="white" size="lg" class="flex-1 justify-center" @click="$emit('destroy')">
          Close
        </CommonButton>
        <CommonButton size="lg" :loading="isSubmitting" class="flex-1 justify-center" :disabled="!meta.valid" type="submit">
          Continue
        </CommonButton>
      </div>
    </form>
  </div>
</template>
