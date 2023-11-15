<script setup lang="ts">
import { serialize } from 'error-serializer'
import type { Web3WalletTypes } from '@walletconnect/web3wallet'
import type { SessionTypes } from '@walletconnect/types'
import * as yup from 'yup'
import { useField, useForm } from 'vee-validate'

import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect.svg'
import SVGQr from '~/assets/images/icons/qr.svg?component'

import 'vue-lite-youtube-embed/style.css'

const emit = defineEmits(['destroy'])

const wcStoreV2 = useWalletConnectV2()

const isTutorialWatched = useLocalStorage('wallet-c-tutorial-watched', false)
const isIframeVisible = ref(true)
const [loading, toggle] = useToggle(false)

const connection = shallowRef()
const proposal = ref<Web3WalletTypes.SessionProposal>()
const namespaces = ref<SessionTypes.Namespaces>()

const isExpertMode = ref(false)
const connectionChainId = shallowRef(137)

provide('isExpertMode', isExpertMode)
provide('connectionChainId', connectionChainId)

const { handleSubmit, errors, meta } = useForm({
  validationSchema: yup.object({
    uri: yup
      .string()
      .required()
      .test('uri', 'Incorrect URI', (value: any) => {
        try {
          const version = wcStoreV2.getConnectionVersion(value)
          if (version === 1)
            return true

          else if (version === 2)
            return true

          return false
        }
        catch (e) {
          return false
        }
      }),
  }),
})

const { value: uri, meta: uriMeta } = useField<string>(
  'uri',
  {},
  {
    initialValue: '',
  },
)

const prepareAndConnect = handleSubmit(async () => {
  if (!uri.value)
    return
  try {
    toggle(true)
    const version = wcStoreV2.getConnectionVersion(uri.value)
    if (version === 1) {
      throw new Error('Version not supported', { cause: 'version-error' })
    }
    else {
      const { approvedNamespaces, sessionProposal } = await wcStoreV2.prepareConnectV2(uri.value)

      proposal.value = sessionProposal
      namespaces.value = approvedNamespaces

      console.log(sessionProposal)
    }
    uri.value = ''
  }
  catch (e: any) {
    const err = serialize(e)

    if (err?.cause?.message == 'version-error') {
      openDialogModal({
        title: err.message,
        content: 'WalletConnect V1 is deprecated and not supported anymore',
        type: 'error',
        buttonText: 'I Understand',
      })
    }
    else {
      openDialogModal({
        title: 'Connected Failed',
        content: `Try again or return to the home page.<br />
          <span style='overflow-wrap:anywhere' class='mt-4 block'>Details: ${err.message}</span>`,
        type: 'error',
        buttonText: 'Try Again',
      })
    }
  }
  finally {
    toggle(false)
  }
})

function contentTemplate(url: string, name: string) {
  if (!url)
    return `You can now use ${name} with your Avocado wallet.`

  return `You can now use <a target='_blank' rel='noopener noreferrer' class='text-primary' href=${url}>
        ${name}
        </a> with your Avocado wallet.`
}

async function connect() {
  try {
    toggle(true)
    let content = ''

    if (proposal.value && namespaces.value) {
      // handle v2 connection
      await wcStoreV2.connect(
        proposal.value,
        namespaces.value,
      )
      const metadata = proposal.value.params.proposer.metadata
      content = contentTemplate(metadata.url, metadata.name)
    }

    emit('destroy')
    openDialogModal({
      title: 'Connected Successfully',
      content,
      type: 'success',
      isButtonVisible: false,
    })

    uri.value = ''
    connection.value = undefined
  }
  catch (e) {
    emit('destroy')
    openDialogModal({
      title: 'Connected Failed',
      content: 'Try again or return to the home page.',
      type: 'error',
      buttonText: 'Try Again',
    })
  }
  finally {
    toggle(false)
  }
}

onMounted(async () => {
  if (isTutorialWatched.value)
    return (isIframeVisible.value = false)
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <WCApproveConnectionV2 v-if="proposal" class="p-5 sm:p-7.5" :proposal="proposal" :loading="loading" @connect="connect" @destroy="$emit('destroy')" />

    <form
      v-else
      @submit.prevent="prepareAndConnect"
    >
      <ModalTitle class="border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
        <template #icon>
          <SVGWalletConnect class="h-9 w-9 shrink-0" />
        </template>
        <template #title>
          Connect with WalletConnect
        </template>
        <template #subtitle>
          Do not close this window while connecting.<br>
          Have a question? Follow this
          <a
            target="blank"
            rel="noopener noreferrer"
            href="https://guides.avocado.instadapp.io/using-avocado/using-walletconnect"
            class="inline-flex gap-2.5 text-primary"
          >guide</a>.
        </template>
      </ModalTitle>

      <div class="flex flex-col gap-5 p-5 sm:px-7.5">
        <CommonInput
          v-model="uri"
          name="uri"
          type="search"
          autofocus
          :error-message="uriMeta.dirty ? errors.uri : ''"
          placeholder="QR code or link"
        >
          <template v-if="!uri" #suffix>
            <SVGQr class="text-gray-400" />
          </template>
        </CommonInput>

        <CommonButton
          type="submit"
          :disabled="!meta.valid"
          :loading="loading"
          class="w-full justify-center"
          size="lg"
        >
          Connect
        </CommonButton>
      </div>
    </form>

    <div v-if="isIframeVisible" class="p-5 pt-0 sm:p-7.5 sm:pt-0" @click="isTutorialWatched = true">
      <h1 class="mb-3 text-center text-xs font-medium leading-5 text-gray-400">
        Looking for step-by-step instructions? <br>Watch this video.
      </h1>
      <LiteYouTubeEmbed
        id="1CcLfV2rxjA"
        title="Connecting Avocado to Uniswap"
      />
    </div>
  </div>
</template>

<style>
.yt-lite {
  border-radius: 15px;
}
</style>
