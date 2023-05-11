<script setup lang="ts">
import DeleteSVG from '~/assets/images/icons/delete.svg'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg'
import CopySVG from '~/assets/images/icons/copy.svg'
import AvatarSVG from '~/assets/images/icons/avatar.svg'
import PlusSVG from '~/assets/images/icons/plus.svg'

const { authorities, deleteAuthority } = useAuthorities()

function getRandomColor() {
  return Math.floor(Math.random() * 16777215).toString(16)
}
</script>

<template>
  <div class="flex flex-col gap-5 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Avocado Authorites
      </h2>
      <span class="text-xs text-slate-400">
        Authorities are addresses that have complete access to your Avocado Wallet and can initiate
        <br>
        any transaction. Make sure you only add trusted Addresses as Authority.
      </span>
    </div>
    <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
      <div v-for="(authority, i) in authorities" :key="authority" class="flex items-center justify-between py-6.5 px-7.5 border-b-1 border-slate-150 dark:border-slate-800 w-full">
        <div class="flex items-center gap-5 flex-1">
          <AvatarSVG
            :style="{
              color: getRandomColor(),
            }"
            class="-mr-2"
          />
          <Copy v-tippy="(authority, i)" :text="authority">
            <template #content>
              <span class="dark:text-white text-slate-900">{{ authority }}</span>
            </template>
            <template #copy>
              <div
                class="ml-2.5 dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
              >
                <CopySVG class="w-[14px] h-[14px] m-auto text-slate-400" />
              </div>
            </template>
          </Copy>
          <button
            class="dark:bg-slate-800 bg-slate-150 text-slate-400 rounded-full w-7.5 h-7.5"
          >
            <ExternalLinkSVG class="w-[14px] h-[14px] m-auto" />
          </button>
        </div>
        <button
          class="disabled:dark:bg-slate-800 disabled:bg-slate-150 bg-red-alert bg-opacity-20 disabled:dark:text-slate-600 disabled:text-slate-300 text-red-alert rounded-full w-7.5 h-7.5"
          :disabled="i === 0"
          @click="deleteAuthority(authority)"
        >
          <DeleteSVG class="w-[14px] h-[14px] m-auto" />
        </button>
      </div>
      <div class="flex py-6.5 px-7.5">
        <button class="flex items-center text-primary gap-3" @click="openAddAuthority">
          <div class="bg-primary w-5 h-5 rounded-full flex">
            <PlusSVG class="text-white m-auto w-2 h-2" />
          </div>
          Add New Owner
        </button>
      </div>
    </div>
  </div>
</template>
