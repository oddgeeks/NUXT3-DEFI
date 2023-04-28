<script setup>
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg?component'

const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')
</script>

<template>
  <div>
    <div
      class="relative pt-7.5 pb-6.25 px-7.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
      :class="{ 'blur pointer-events-none': !safeAddress }"
    >
      <StyledQrCode
        :key="account"
        class="rounded-5 mx-auto bg-white overflow-hidden"
        :size="160"
        :margin="7"
        :data="account"
      />

      <span class="mt-5 text-xs dark:text-slate-500 text-slate-400">Avocado Address</span>
      <div class="flex items-center gap-2.5">
        <button
          @click="
            openDialogModal({
              type: 'question',
              title: 'Your Avocado Wallet',
              isButtonVisible: false,
              content: `Deposit or receive funds by scanning or copying your Avocado Wallet QR code. Your Avocado wallet is fundamentally linked to your wallet address making (EOA) you the true owner of it.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
            })
          "
        >
          <QuestionCircleSVG v-if="account" class="w-4.5 h-4.5 text-primary" />
        </button>
        <Copy :text="account">
          <template #content>
            {{ shortenHash(account) }}
          </template>
        </Copy>
      </div>
      <NuxtLink
        :href="`/w/${account}`"
        external
        target="_blank"
        class="absolute top-0 right-0 m-3.5 inline-flex text-primary text-sm items-center space-x-2"
      >
        <ExternalLinkSVG class="w-4 h-4 text-slate-400" />
      </NuxtLink>
    </div>
  </div>
</template>
