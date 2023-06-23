<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CopySVG from '~/assets/images/icons/copy.svg?component'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { signers } = storeToRefs(useAuthorities())
const { account } = useWeb3()
</script>

<template>
  <div class="flex flex-col gap-5 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <span class="text-xs text-slate-400 leading-5">
        Authorities are addresses that have complete access to your Avocado Wallet and can initiate
        <br>
        any transaction. Make sure you only add trusted Addresses as Authority.
      </span>
    </div>
    <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
      <div v-for="(signer) in signers" :key="signer.address" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
          <AuthorityAvatar
            :address="signer.address"
            class="-mr-2 shrink-0"
          />
          <span class="dark:text-white text-slate-900 sm:block hidden">{{ signer.address }}
            <span v-if="account.toLowerCase() === signer.address.toLowerCase()">
              (Owner)
            </span>
            <span class="dark:text-white text-xs text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(signer.address) }}</span>
            <Copy :text="signer.address">
              <template #copy>
                <div
                  class="dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
                >
                  <CopySVG class="w-[14px] h-[14px] m-auto text-slate-400" />
                </div>
              </template>
            </Copy>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
