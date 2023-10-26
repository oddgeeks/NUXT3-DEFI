<script setup lang="ts">
const emit = defineEmits(['resolve'])

const { mfaTermsAccepted } = useMfa()

const checked = ref<boolean[]>([])
const terms = [
  'Activating Avocado Protect allows the Avocado backend to oversee transaction approvals based on your 2FA settings. 2FA activation is controlled by you. The Avocado team cannot disable it for you once activated.',
  'We strongly advise setting up a Backup Address along with 2FA. This combination ensures you can access your account even if you lose your 2FA.',
  'By enabling Avocado Protect, you confirm your commitment to safeguarding your keys, backup codes for the authenticator, and all other essential credentials for account access.',
]

function handleProceed() {
  mfaTermsAccepted().value = true
  emit('resolve', true)
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <div class="flex items-center gap-[14px]">
      <SvgoExclamationCircle class="h-10 w-10 text-orange-400" />
      <h1 class="text-lg">
        Important Notice:  Please Read Carefully
      </h1>
    </div>
    <ul class="flex flex-col gap-5">
      <li v-for="term, i in terms" :key="term" class="text-xs font-medium leading-5 text-slate-400">
        <label class="flex cursor-pointer gap-2.5" :for="`input-${i}`">
          <input :id="`input-${i}`" v-model="checked" :value="i" class="peer sr-only" type="checkbox">
          <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle mt-1 h-5 w-5 shrink-0 cursor-pointer text-slate-500" />
          {{ term }}
        </label>
      </li>
    </ul>
    <CommonNotification class="!max-h-[100%] rounded-xl" type="warning">
      <div class="flex flex-col gap-2.5">
        <p class="text-sm font-medium">
          Should you lose access to your 2FA, Backups or both, you understand that Instadapp Labs LLC cannot assist in recovering your account and is absolved from any associated liability.
        </p>
        <NuxtLink class="text-xs text-primary" to="https://guides.avocado.instadapp.io/avocado-protect-2fa/how-does-avocado-protect-2fa-work" external target="_blank">
          Open Avocado Protect Docs
        </NuxtLink>
      </div>
    </CommonNotification>
    <CommonButton class="justify-center text-center" :disabled="checked.length !== terms.length" size="lg" @click="handleProceed">
      Proceed
    </CommonButton>
    <p class="flex gap-2.5 text-xs font-medium text-orange">
      <SvgoInfo2 class="mt-0.5 shrink-0" />
      By activating this feature, you fully accept responsibility for the security and access of your account.
    </p>
  </div>
</template>
