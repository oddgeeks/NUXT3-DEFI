<script setup lang="ts">
const emit = defineEmits(['resolve'])

const { mfaTermsAccepted } = useMfa()

const checked = ref<boolean[]>([])
const terms = [
  'Activating Avocado Protect allows the Avocado backend to oversee transaction approvals based on your 2FA settings. Once 2FA is activated, it cannot be deactivated by the Avocado or Instadapp teams.',
  'We strongly advise setting up a Backup Address along with 2FA. This combination ensures you can access your account even if you lose your 2FA.',
  'By enabling Avocado Protect, you confirm your commitment to safeguarding your keys, backup codes for the authenticator, and all other essential credentials for account access.',
  'Should you lose access to your 2FA, Backup or both, you understand that Instadapp Labs LLC cannot assist in recovering your account and is absolved from any associated liability.',
  'By activating this feature, you acknowledge and accept full responsibility for the security and access of your account.',
]

function handleProceed() {
  mfaTermsAccepted.value = true
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
    <CommonButton class="justify-center text-center" :disabled="checked.length !== terms.length" size="lg" @click="handleProceed">
      Proceed
    </CommonButton>
  </div>
</template>
