<script setup lang="ts">
import { getAddress } from 'ethers/lib/utils'
import { storeToRefs } from 'pinia'
import CopySVG from '~/assets/images/icons/copy.svg?component'
import TrashSVG from '~/assets/images/icons/trash.svg?url'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { signers } = storeToRefs(useAuthorities())
const { account } = useWeb3()

async function handleDeleteSigner(signer: ISigner) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to delete the Signer?',
    type: 'question',
    headerIconUrl: TrashSVG,
    isButtonVisible: true,
    isCancelButtonVisible: true,
    buttonText: 'Delete',
    cancelButtonText: 'Cancel',
    cancelButtonProps: {
      color: 'white',
    },
    buttonProps: {
      color: 'red',
    },
  })
}
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
      <div v-if="account" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
            <AuthorityAvatar
              :address="account"
              class="-mr-2 shrink-0"
            />
            <span class="sm:block hidden">
              {{ account }}
            </span>
            <span class="dark:text-white text-xs text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(account) }}</span>
            <span>
              (Owner)
            </span>
            <Copy icon-only :text="account">
              <template #copy>
                <div
                  class="dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
                >
                  <CopySVG class="w-[14px] h-[14px] m-auto text-slate-400" />
                </div>
              </template>
            </Copy>
          </div>
        </div>
      </div>
      <template v-for="(signer) in signers" :key="signer.address">
        <div v-if="!(getAddress(account) === getAddress(signer.address))" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
              <AuthorityAvatar
                :address="signer.address"
                class="-mr-2 shrink-0"
              />
              <span class="sm:block hidden">
                {{ signer.address }}
              </span>
              <span class="dark:text-white text-xs text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(signer.address) }}</span>
              <Copy icon-only :text="signer.address">
                <template #copy>
                  <div
                    class="dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
                  >
                    <CopySVG class="w-[14px] h-[14px] m-auto text-slate-400" />
                  </div>
                </template>
              </Copy>
            </div>
            <button @click="handleDeleteSigner(signer)">
              <SvgoTrash class="disabled:text-slate-600 w-7.5 h-7.5" :disabled="getAddress(account) === getAddress(signer.address)" />
            </button>
          </div>
        </div>
      </template>
      <div class="flex py-6.5 px-7.5 border-t-1 border-slate-150 dark:border-slate-800">
        <button class="flex items-center text-primary gap-3" @click="openAddSignerModal()">
          <div class="bg-primary w-5 h-5 rounded-full flex">
            <SvgoPlus class="text-white m-auto w-2 h-2" />
          </div>
          Add New Signer
        </button>
      </div>
    </div>
  </div>
</template>
