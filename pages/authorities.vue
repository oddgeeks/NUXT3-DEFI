<script setup lang="ts">
import { storeToRefs } from 'pinia'
import DeleteSVG from '~/assets/images/icons/delete.svg?component'
import CopySVG from '~/assets/images/icons/copy.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import TrashSVG from '~/assets/images/icons/trash.svg?url'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { deleteAuthority } = useAuthorities()
const { authorities, isWalletSecondary } = storeToRefs(useAuthorities())

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
    deleteAuthority(authority)
}
</script>

<template>
  <div class="flex flex-col gap-5 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Avocado Authorites
      </h2>
      <span class="text-xs text-slate-400 leading-5">
        Authorities are addresses that have complete access to your Avocado Wallet and can initiate
        <br>
        any transaction. Make sure you only add trusted Addresses as Authority.
      </span>
    </div>
    <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
      <div v-for="(authority) in authorities" :key="authority.address" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center gap-5 flex-1">
          <AuthorityAvatar
            :address="authority.address"
            class="-mr-2"
          />
          <span class="dark:text-white text-slate-900">{{ authority.address }}</span>
          <Copy :text="authority.address">
            <template #copy>
              <div
                class="ml-2.5 dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
              >
                <CopySVG class="w-[14px] h-[14px] m-auto text-slate-400" />
              </div>
            </template>
          </Copy>
          <CommonButton v-if="!isWalletSecondary" class="text-xs leading-[14px]" color="white" @click="openManageAuthorityModal(authority)">
            Manage Networks ({{ authority.chainIds.length }})
          </CommonButton>
        </div>
        <button
          v-if="!isWalletSecondary"
          class="disabled:dark:bg-slate-800 disabled:bg-slate-150 bg-red-alert bg-opacity-20 disabled:dark:text-slate-600 disabled:text-slate-300 text-red-alert rounded-full w-7.5 h-7.5"
          @click="handleDeleteAuthority(authority)"
        >
          <DeleteSVG class="w-[14px] h-[14px] m-auto" />
        </button>
      </div>
      <div v-if="!isWalletSecondary" class="flex py-6.5 px-7.5 border-t-1 border-slate-150 dark:border-slate-800">
        <button class="flex items-center text-primary gap-3" @click="openAddAuthorityModal()">
          <div class="bg-primary w-5 h-5 rounded-full flex">
            <PlusSVG class="text-white m-auto w-2 h-2" />
          </div>
          Add New Authority
        </button>
      </div>
    </div>
  </div>
</template>
