<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'
import { storeToRefs } from 'pinia'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

const props = defineProps<{
  payload?: {
    method: string
    params: any
  }
  session?: SessionTypes.Struct
  type: 'wc' | 'transfer'
  name: string
  chainId: number | string
  sendData?: ISendData
  edit?: boolean
  metadata?: string
}>()

const emit = defineEmits(['destroy', 'resolve'])

const { addBookmark, updateBookmark, deleteBookmark } = useBookmark()
const { getTokenByAddress } = useTokens()
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

const token = computed(() => !props.sendData ? null : getTokenByAddress(props.sendData?.tokenAddress, props.chainId))

const onSubmit = handleSubmit(() => {
  const bookmark: IBookmark = {
    name: value.value,
    chainId: props.chainId,
    payload: props.payload,
    safeAddress: safeAddress.value,
    sendData: props.sendData,
    session: props.session,
    type: props.type,
    metadata: props.metadata,
  }
  try {
    if (props.edit)
      updateBookmark(props as IBookmark, bookmark)

    else
      addBookmark(bookmark)

    openSnackbar({
      message: 'Bookmark saved successfully',
      type: 'success',
    })

    setTimeout(() => {
      emit('resolve', true, bookmark)
    }, 500)
  }
  catch (error: any) {
    openSnackbar({
      message: error.message,
      type: 'error',
    })
  }
})

async function handleDeleteBookmark() {
  const { success } = await openDialogModal({
    title: 'Are you sure you want delete shortcut?',
    type: 'question',
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

  if (success) {
    deleteBookmark(props.name!)
    emit('resolve', true)
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex items-center gap-[14px] p-7.5">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
        <SvgoBookmark />
      </div>
      <h1>
        {{ edit ? "Edit" : "Create" }} Transaction Shortcut
      </h1>
    </div>
    <hr class="border-slate-150 dark:border-gray-800">
    <div class="p-7.5 font-medium">
      <table class="text-sm">
        <tbody>
          <template v-if="type === 'wc' && session">
            <tr>
              <td class="pb-7.5 text-gray-400">
                App URL
              </td>
              <td class="pb-7.5 pl-[60px]">
                <NuxtLink target="_blank" external class="text-primary" :to="session.peer.metadata.url">
                  {{ session.peer.metadata.url }}
                </NuxtLink>
              </td>
            </tr>
            <tr>
              <td class="pb-7.5 text-gray-400">
                Network
              </td>
              <td class="pb-7.5 pl-[60px]">
                <div class="flex items-center gap-2.5">
                  <ChainLogo class="h-5.5 w-5.5" :chain="chainId" />
                  {{ chainIdToName(chainId) }}
                </div>
              </td>
            </tr>
            <tr>
              <td class="text-gray-400">
                App Name
              </td>
              <td class="pl-[60px] align-baseline">
                {{ session.peer.metadata.name }}
              </td>
            </tr>
          </template>
          <template v-if="type === 'transfer' && sendData">
            <tr>
              <td class="pb-7.5 text-gray-400">
                Network
              </td>
              <td class="pb-7.5 pl-[60px]">
                <div class="flex items-center gap-2.5">
                  <ChainLogo class="h-5.5 w-5.5" :chain="sendData.fromChainId" />
                  <span>{{ chainIdToName(sendData.fromChainId) }}</span>
                  <template v-if="sendData.toChainId && sendData.toChainId !== sendData.fromChainId">
                    <SvgoArrowRight class="w-5 text-gray-400" />
                    <ChainLogo class="h-5.5 w-5.5" :chain="sendData.toChainId" />
                    <span>{{ chainIdToName(sendData.toChainId) }}</span>
                  </template>
                </div>
              </td>
            </tr>
            <tr>
              <td class="pb-7.5 text-gray-400">
                Amount
              </td>
              <td class="pb-7.5 pl-[60px]">
                <div class="flex items-center gap-2.5 uppercase">
                  <SafeTokenLogo class="h-5.5 w-5.5" :url="token?.logoURI" />
                  {{ formatDecimal(sendData.amount) }}
                  {{ token?.symbol }}
                </div>
              </td>
            </tr>
            <tr>
              <td class="text-gray-400">
                Dest. Address
              </td>
              <td class="pl-[60px]">
                <NuxtLink v-tippy="sendData.address" target="_blank" class="font-medium text-primary" :to="getExplorerUrl(sendData.toChainId, `/address/${sendData.address}`)" external>
                  {{ shortenHash(sendData.address) }}
                </NuxtLink>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <hr class="border-slate-150 dark:border-gray-800">
    <div class="flex flex-col gap-2.5 p-7.5">
      <span class="text-sm font-medium">Name Shortcut</span>
      <CommonInput v-model="value" name="shortcut-name" autofocus placeholder="Enter the name" />
    </div>
    <hr class="border-slate-150 dark:border-gray-800">
    <div class="flex flex-col gap-7.5 p-7.5">
      <div class="flex gap-2.5 text-xs font-medium text-gray-400">
        <SvgoInfo2 class="mt-0.5 shrink-0 text-gray-500" />
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
      <button v-if="edit" type="button" class="flex items-center justify-center gap-2.5 text-xs text-red-alert" @click="handleDeleteBookmark">
        Delete Shortcut <SvgoDelete class="h-3 w-3" />
      </button>
    </div>
  </form>
</template>
