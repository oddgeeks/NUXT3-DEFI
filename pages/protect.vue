<script setup lang="ts">
import { serialize } from 'error-serializer'
import { Tippy } from 'vue-tippy'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { hasInstadappSigner, instadappSignerNetworks, backupSigners } = storeToRefs(useMultisig())
const { fetchSafeInstanceses } = useSafe()
const { mfaTypes, mfaTermsAccepted, preferredMfaType, preferredMfa, verifyDeleteRequest, signAndRequestDeleteMfaCode, activateToptMfa, backupMfa, isAvocadoProtectActive, atLeastOneMfaVerifed } = useMfa()

async function handleDeactivate(mfa: IMfa, close: () => void) {
  if (mfa.value !== 'totp') {
    const success = await signAndRequestDeleteMfaCode(mfa)

    if (!success)
      return
  }

  const { success } = await openVerifyMFAModal({
    mfa,
    mfaRequestType: 'delete',
    request: signAndRequestDeleteMfaCode.bind(null, mfa),
    verify: verifyDeleteRequest,
  })

  if (success) {
    notify({
      type: 'success',
      message: `Successfully deactivated ${mfa.label}`,
    })

    setFallbackDefaultMfaType(mfa)

    fetchSafeInstanceses()
  }
  else {
    notify({
      type: 'error',
      message: `Failed to deactivate ${mfa.label}`,
    })
  }

  close()
}

function setFallbackDefaultMfaType(mfa: IMfa) {
  if (preferredMfaType.value === mfa.value) {
    const activatedMfa = mfaTypes.value.find(i => i.activated && i.value !== mfa.value && i.value !== 'backup')
    if (activatedMfa) {
      preferredMfaType.value = activatedMfa.value
    }
    else {
      // if no mfa is activated, set default to undefined
      preferredMfaType.value = undefined
    }
  }
}

async function handleActivate(mfa: IMfa) {
  try {
    if (!mfaTermsAccepted.value) {
      const { success } = await openMfaTermsModal()

      if (!success)
        return
    }

    if (mfa.value === 'totp') { await activateToptMfa(mfa) }

    else {
      const { success } = await openMfaActivateModal({ mfaType: mfa })

      if (success) {
        if (!preferredMfaType.value)
          preferredMfaType.value = mfa.value

        notify({
          type: 'success',
          message: `Successfully activated ${mfa.label}`,
        })
      }
    }

    fetchSafeInstanceses()
  }
  catch (e) {
    const parsed = serialize(e)

    notify({
      type: 'error',
      message: parsed.message,
    })
  }
}

function handleSetDefault(mfa: IMfa, close: () => void) {
  preferredMfaType.value = mfa.value
  close()
  notify({
    type: 'success',
    message: `Default 2FA method set to ${mfa.label}`,
  })
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <div v-if="!isAvocadoProtectActive">
      Safe is not supported
    </div>
    <div v-else class="flex flex-col gap-7.5">
      <div class="flex flex-col gap-2.5">
        <h1 class="text-[30px] leading-10">
          Configure Avocado Protect ⚔️
        </h1>
        <h2 class="text-sm font-medium leading-6 text-slate-400">
          Avocado Protect is a non-custodial 2FA service which allows you to add an additional layer of verification before a transaction goes through. You can activate multiple methods at once. Note only one method will be required to validate transactions.
        </h2>
        <NuxtLink class="text-sm font-medium text-primary" external to="/">
          Learn more about how it works
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-5">
        <div class="rounded-5 bg-slate-50 dark:bg-gray-850">
          <div class="flex flex-col gap-7.5 p-7.5">
            <div>
              <h2 class="mb-2.5">
                OTP Login
              </h2>
              <h3 class="text-xs font-medium leading-5 text-slate-400">
                Set up one or more OTP methods & use any one to verify identity at the time of transaction.
              </h3>
            </div>
            <div>
              <ul class="flex flex-col gap-4">
                <template v-for="mfa in mfaTypes" :key="mfa.value">
                  <li v-if="mfa.value !== 'backup'">
                    <div class="flex h-[66px] w-full items-center  justify-between rounded-2xl bg-slate-100 p-5 text-left ring-1 ring-slate-200 dark:bg-slate-850 dark:ring-slate-750">
                      <div class="flex w-full items-center justify-between">
                        <div class="flex flex-col gap-1">
                          <span class="text-xs font-medium leading-5">
                            {{ mfa.label }}
                          </span>
                          <span v-if="mfa.value === preferredMfa.value && mfa.activated" class="text-xs font-medium text-slate-400">
                            Default
                          </span>
                        </div>
                        <span v-if="mfa.activated" class="flex items-center gap-2.5 text-xs font-medium">
                          <template v-if="hasInstadappSigner">
                            <SvgoCheckCircle class="success-circle w-5" />
                            <span class="text-primary">
                              Enabled
                            </span>
                          </template>
                          <template v-else>
                            <span class="text-orange">
                              Manage networks to activate
                            </span>
                          </template>

                          <Popover class="relative ml-2.5 inline-flex items-center">
                            <PopoverButton class="group focus:outline-none">
                              <SvgoDots />
                            </PopoverButton>

                            <transition
                              enter-active-class="transition duration-200 ease-out"
                              enter-from-class="translate-y-1 opacity-0"
                              enter-to-class="translate-y-0 opacity-100"
                              leave-active-class="transition duration-150 ease-in"
                              leave-from-class="translate-y-0 opacity-100"
                              leave-to-class="translate-y-1 opacity-0"
                            >
                              <PopoverPanel
                                v-slot="{ close }"
                                class="absolute -top-24 left-1/2 z-10 flex -translate-x-1/2 flex-col rounded-2xl border border-slate-150 bg-slate-100 p-2 text-sm font-medium dark:border-[#1E293B] dark:bg-gray-950"
                              >
                                <button class="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 hover:bg-slate-150 hover:dark:bg-slate-800" @click="handleSetDefault(mfa, close)">
                                  <SvgoAsDefault /> Set as default
                                </button>
                                <button class="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-red-alert hover:bg-red-alert/10" @click="handleDeactivate(mfa, close)">
                                  <SvgoTrash2 /> Deactivate
                                </button>
                              </PopoverPanel>
                            </transition>
                          </Popover>
                        </span>
                        <CommonButton v-else @click="handleActivate(mfa)">
                          Enable Now
                        </CommonButton>
                      </div>
                    </div>
                  </li>
                </template>
              </ul>
            </div>
          </div>
          <div v-if="atLeastOneMfaVerifed" class="flex items-baseline justify-between border-t border-slate-150 p-7.5 pt-5 dark:border-slate-800">
            <div class="flex flex-col gap-2.5">
              <span class="text-sm font-medium">
                Active on {{ instadappSignerNetworks.length }} networks
              </span>
              <div class="flex">
                <ChainLogo v-for="i in instadappSignerNetworks" :key="i.chainId" class="-ml-2 h-6 w-6 first:ml-0" :chain="i.chainId" />
              </div>
            </div>
            <button class="flex items-center gap-2 text-sm font-medium text-primary" @click="openMfaSignInstadappSignerModal(instadappSigner)">
              Manage Networks
              <SvgoCog />
            </button>
          </div>
        </div>
        <div class="flex flex-col rounded-5 bg-slate-50 dark:bg-gray-850">
          <div class="p-7.5">
            <h2 class="mb-2.5">
              Backup outh (optional)
            </h2>
            <h3 class="mb-2.5 text-xs font-medium leading-5 text-slate-400">
              In case you don't have access to OTP's, you can use a secondary address to confirm your identity. This ensures you are never locked out of your Avocado Wallet
            </h3>

            <div class="flex h-[66px] w-full items-center justify-between rounded-2xl bg-slate-100 p-5 text-left ring-1 ring-slate-200 dark:bg-slate-850 dark:ring-slate-750">
              <div class="flex w-full items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <p class="text-xs font-medium leading-5">
                    {{ backupMfa?.title }}
                  </p>
                  <ul>
                    <li v-for="signer in backupSigners" :key="signer.address" class="flex items-center gap-1.5 text-xs font-medium leading-5 text-slate-400">
                      {{ shortenHash(signer.address, 10) }}
                      <Copy icon-only :text="signer.address" />
                    </li>
                  </ul>
                </div>

                <Tippy v-if="!backupMfa?.activated" :content="!(hasInstadappSigner && atLeastOneMfaVerifed) ? 'Activate 2FA to enable backup signer' : undefined">
                  <CommonButton :disabled="!(hasInstadappSigner && atLeastOneMfaVerifed)" @click="openAddBackupSignerModal">
                    Enable Now
                  </CommonButton>
                </Tippy>
                <span v-else class="flex items-center gap-2.5 text-xs font-medium">
                  <SvgoCheckCircle class="success-circle w-5" />
                  <span class="text-primary">
                    Enabled
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div v-if="atLeastOneMfaVerifed" class="scroll-style mt-auto flex max-h-[250px] flex-col items-baseline justify-between gap-5 overflow-auto border-t border-slate-150 p-7.5 pt-5 dark:border-slate-800">
            <div v-for="signer in backupSigners" :key="signer.address" class="flex w-full items-baseline justify-between">
              <div class="flex flex-col gap-2.5">
                <span class="text-sm font-medium">
                  Active on {{ signer.chainIds.length }} networks
                </span>
                <span v-if="backupSigners.length > 1" class="text-xs text-slate-400">
                  {{ signer.address }}
                </span>
                <div class="flex">
                  <ChainLogo v-for="i in signer.chainIds" :key="i" class="-ml-2 h-6 w-6 first:ml-0" :chain="i" />
                </div>
              </div>
              <button class="flex items-center gap-2 text-sm font-medium text-primary" @click="openMfaSignInstadappSignerModal(signer.address, true)">
                Manage Networks
                <SvgoCog />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
