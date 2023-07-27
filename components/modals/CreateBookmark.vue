<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'
import { storeToRefs } from 'pinia'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps<{
  payload: {
    method: string
    params: any
  }
  session: SessionTypes.Struct
  name?: string
  chainId: number | string
  edit?: boolean
}>()

const emit = defineEmits(['destroy'])

const { addBookmark, updateBookmark } = useBookmark()
const { safeAddress } = storeToRefs(useSafe())

const {
  handleSubmit,
  meta,
} = useForm({
  validationSchema: yup.object({
    'shortcut-name': yup.string().required(''),
  }),
})

const { value } = useField<string>('shortcut-name', undefined, {
  initialValue: props.name,
})

const onSubmit = handleSubmit(() => {
  const bookmark: IWcBookmark = {
    name: value.value,
    chainId: props.chainId,
    payload: props.payload,
    safeAddress: safeAddress.value,
    session: props.session,
  }
  try {
    if (props.edit)
      updateBookmark(props.name!, value.value)

    else
      addBookmark(bookmark)

    openSnackbar({
      message: 'Bookmark saved successfully',
      type: 'success',
    })

    setTimeout(() => {
      emit('destroy')
    }, 500)
  }
  catch (error: any) {
    openSnackbar({
      message: error.message,
      type: 'error',
    })
  }
})
</script>

<template>
  <form @submit="onSubmit">
    <div class="p-7.5 flex items-center gap-[14px]">
      <div class="bg-primary w-10 h-10 flex items-center justify-center rounded-full">
        <SvgoBookmark />
      </div>
      <h1>
        {{ edit ? "Edit" : "Create" }} Transaction Shortcut
      </h1>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5 font-medium">
      <table class="text-sm">
        <tbody>
          <tr>
            <td class="text-slate-400 pb-7.5">
              App URL
            </td>
            <td class="pl-[60px] pb-7.5">
              <NuxtLink target="_blank" external class="text-primary" :to="session.peer.metadata.url">
                {{ session.peer.metadata.url }}
              </NuxtLink>
            </td>
          </tr>
          <tr>
            <td class="text-slate-400 pb-7.5">
              Network
            </td>
            <td class="pl-[60px] pb-7.5">
              <div class="flex gap-2.5 items-center">
                <ChainLogo class="w-5.5 h-5.5" :chain="chainId" />
                {{ chainIdToName(chainId) }}
              </div>
            </td>
          </tr>
          <tr>
            <td class="text-slate-400">
              App Name
            </td>
            <td class="pl-[60px] align-baseline">
              {{ session.peer.metadata.name }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="flex flex-col gap-2.5 p-7.5">
      <span class="text-sm font-medium">Name Shortcut</span>
      <CommonInput v-model="value" name="shortcut-name" autofocus placeholder="Enter the name" />
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5 flex flex-col gap-7.5">
      <div class="text-xs text-slate-400 font-medium flex gap-2.5">
        <SvgoInfo2 class="text-slate-500 shrink-0 mt-0.5" />
        Transaction Shortcuts are best suited for non-time-sensitive transactions like sends, repayments, claiming and minting. Some transactions may not work with Tx Shortcut.
      </div>
      <div class="grid grid-cols-2 gap-4">
        <CommonButton class="justify-center" size="lg" color="white" @click="$emit('destroy')">
          Cancel
        </CommonButton>
        <CommonButton type="submit" :disabled="!meta?.valid" class="justify-center" size="lg">
          Save Tx Shortcut
        </CommonButton>
      </div>
    </div>
  </form>
</template>
