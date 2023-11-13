<script setup lang="ts">
import { storeToRefs } from 'pinia'
import LinkSVG from '~/assets/images/icons/external-link.svg?raw'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'
import GroupIconSVG from '~/assets/images/icons/group.svg?component'
import IndividualIconSVG from '~/assets/images/icons/individual.svg?component'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { networkPreference, tokenBalances } = storeToRefs(useSafe())

const listType = useLocalStorage('listType', 'individual')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const isHideZeroBalances = useLocalStorage('hide-zero-balances', false)

const balancesTokenCount = computed(() => {
  if (!tokenBalances.value)
    return 0
  return tokenBalances.value.filter(token => gt(token.balance || 0, 0))?.length
})

function handleOpenDialog() {
  openDialogModal({
    type: 'question',
    title: 'Avocado Wallet Balances',
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href=' https://guides.avocado.instadapp.io/getting-started/depositing-fundscount' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  })
}

function selectType(type: string) {
  listType.value = type
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-7.5">
    <SecondaryOwner />
    <TotalBalance />
    <YourWallet />
    <DApps />
    <div class="flex flex-1 flex-col gap-5 lg:flex-row">
      <div class="relative flex w-full flex-col gap-5">
        <div class="flex flex-col gap-5">
          <div class="flex justify-between sm:pr-7.5">
            <div class="flex gap-7.5">
              <h2 class="inline-flex items-center gap-2 font-semibold">
                Balances <span class="hidden sm:block">
                  ({{ balancesTokenCount }})
                </span>
                <button v-if="account" @click="handleOpenDialog">
                  <SvgoQuestionCircle class="h-5 w-5 text-primary" />
                </button>
              </h2>
              <ClientOnly v-if="account">
                <button
                  :class="{
                    'text-white': isHideZeroBalances,
                  }"
                  class="hidden items-center gap-2.5 text-sm text-gray-400 sm:inline-flex"
                  @click="isHideZeroBalances = !isHideZeroBalances"
                >
                  Hide 0 Balances

                  <CheckCircle
                    :class="[
                      { 'success-circle text-white': isHideZeroBalances },
                      { 'svg-circle darker': !isHideZeroBalances },
                    ]"
                    class="h-4 w-4"
                  />
                </button>
              </ClientOnly>
            </div>
            <div v-if="account" class="flex gap-[10px]">
              <ClientOnly v-if="account">
                <div class="hidden items-center gap-[16px] md:flex">
                  <button v-tippy="'Individual View'" @click="() => selectType('individual')">
                    <IndividualIconSVG :class="`${listType === 'individual' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[20px] h-[20px]`" />
                  </button>
                  <button v-tippy="'Group View'" @click="() => selectType('group')">
                    <GroupIconSVG :class="`${listType === 'group' ? 'type-icon-selected' : 'type-icon-unselected'} cursor-pointer w-[22px] h-[22px]`" />
                  </button>
                </div>
              </ClientOnly>
              <MultipleNetworkFilter v-model:networks="networkPreference" />
            </div>
          </div>
          <Balances
            :list-type="listType"
            :hide-zero-balances="isHideZeroBalances"
          />
        </div>
        <div
          v-if="!account"
          class="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 translate-y-1/2 items-center justify-center sm:-translate-y-1/2"
        >
          <div class="flex flex-col items-center justify-center gap-6">
            <p
              class="text-center font-semibold leading-[30px] text-gray-400 sm:whitespace-nowrap sm:text-lg sm:text-white"
            >
              Connect your wallet to see the balances
            </p>

            <div class="w-28">
              <Web3Button />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
