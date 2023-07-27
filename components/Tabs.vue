<script setup lang="ts">
import LinkSVG from '~/assets/images/icons/external-link.svg?raw'

const { account } = useWeb3()

function handleOpenDialog() {
  openDialogModal({
    type: 'question',
    title: 'Avocado Wallet Balances',
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  })
}

const tabs = computed<INavigationTab[]>(() => {
  return [
    {
      label: 'Balances',
      query: undefined,
      value: 'balances',
    },
    {
      label: 'Connected Dapps',
      query: 'dapps',
      value: 'dapps',
    },
    {
      label: 'Transaction Shortcuts',
      query: 'shortcuts',
      value: 'shortcuts',
    },
  ]
})
</script>

<template>
  <ul class="dark:bg-gray-850 bg-slate-50 flex w-fit sm:flex-nowrap flex-wrap sm:justify-normal justify-center font-medium text-sm p-1.5 rounded-5 sm:rounded-10">
    <li v-for="tab in tabs" :key="tab.label">
      <NuxtLink :class=" $route.query.tab === tab.query ? 'dark:bg-slate-800 bg-slate-100 text-white' : ''" class="text-slate-400 flex items-center gap-2.5 px-6 py-2.5 rounded-2xl sm:rounded-7.5" :to="{ query: { tab: tab.query } }">
        {{ tab.label }}
        <template v-if="tab.value === 'balances'">
          <button v-if="account" @click="handleOpenDialog">
            <SvgoQuestionCircle class="w-5 h-5 text-primary" />
          </button>
        </template>
      </NuxtLink>
    </li>
  </ul>
</template>
