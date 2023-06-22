<script setup lang="ts">
import { storeToRefs } from 'pinia'
import DeleteSVG from '~/assets/images/icons/delete.svg?component'
import CopySVG from '~/assets/images/icons/copy.svg?component'
import TrashSVG from '~/assets/images/icons/trash.svg?url'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { signers, isWalletSecondary, selectedSafe } = storeToRefs(useAuthorities())
const { account } = useWeb3()

const owner = computed(() => selectedSafe.value?.owner_address || account.value)

async function handleDeleteAuthority(authority: IAuthority) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to delete the Authority?',
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

  if (success)
    openEstimateAuthorityModal(authority, authority.chainIds, true)
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
      <div v-if="owner" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap sm:text-base text-xs">
          <AuthorityAvatar
            :address="owner"
            class="-mr-2 shrink-0"
          />
          <span class="dark:text-white text-slate-900 sm:block hidden">{{ owner }}</span>
          <span class="dark:text-white text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(owner) }}</span>
          (Owner)
          <Copy :text="owner">
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
      <div v-for="(signer) in signers" :key="signer.address" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
          <AuthorityAvatar
            :address="signer.address"
            class="-mr-2 shrink-0"
          />
          <span class="dark:text-white text-slate-900 sm:block hidden">{{ signer.address }}</span>
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
          <button
            v-if="!isWalletSecondary"
            class="disabled:dark:bg-slate-800 sm:hidden block disabled:bg-slate-150 bg-red-alert bg-opacity-20 disabled:dark:text-slate-600 disabled:text-slate-300 text-red-alert rounded-full w-7.5 h-7.5"
          >
            <DeleteSVG class="w-[14px] h-[14px] m-auto" />
          </button>
          <CommonButton v-if="!isWalletSecondary" class="text-xs leading-[14px] sm:flex-none flex-1 justify-center" color="white">
            Manage Networks ({{ signer.chainIds.length }})
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
