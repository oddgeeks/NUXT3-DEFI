<script setup lang="ts">
const emit = defineEmits(['resolve'])

const { mfaTermsAccepted } = useMfa()

const checked = ref(false)
const terms = [
  'Avocado Protect 2FA adds Avocado\'s backend as a signer on your wallet.This allows the backend to automatically approve / stop transactions based on if you provide the correct OTP or not',
  'In any case, we don\'t have the capability to perform any transaction on your behalf or recover your account if you lose access',
  'We recommend you add a backup address to keep complete control to yourself in case you lose access to email/SMS/Authenticator app.',
  `<a class='text-primary' href='https://guides.avocado.instadapp.io/avocado-protect-2fa/how-does-avocado-protect-2fa-work' target='_blank'>
    Learn more about how Avocado Protect 2FA works
  </a>`,
]

function handleProceed() {
  mfaTermsAccepted().value = true
  emit('resolve', true)
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col gap-7.5 p-7.5 pb-0">
      <div class="flex items-center gap-[14px]">
        <SvgoExclamationCircle class="h-10 w-10 text-orange-400" />
        <h1 class="text-lg">
          Enable Avocado Protect
        </h1>
      </div>
      <ul class="flex flex-col gap-2">
        <li v-for="term in terms" :key="term" class="text-xs font-medium leading-5 text-slate-400" v-html="term" />
      </ul>
    </div>
    <hr class="my-5 border-slate-150 dark:border-slate-800">
    <div class="flex flex-col gap-5 p-7.5 pt-0">
      <label class="flex cursor-pointer items-center gap-2.5 font-medium text-slate-400" for="input-check">
        <input id="input-check" v-model="checked" class="peer sr-only" type="checkbox">
        <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-1 h-5 w-5 shrink-0 cursor-pointer text-slate-500" />
        <span class="peer-checked:text-slate-900 peer-checked:dark:text-white"> I understand the above mentioned information</span>
      </label>
      <CommonButton class="justify-center text-center" :disabled="!checked" size="lg" @click="handleProceed">
        Proceed
      </CommonButton>
    </div>
  </div>
</template>
