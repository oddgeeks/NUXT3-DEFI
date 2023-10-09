<script setup lang="ts">
import { serialize } from 'error-serializer'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { isSelectedSafeLegacy } = storeToRefs(useSafe())
const { hasInstadappSigner, instadappSignerNetworks } = storeToRefs(useMultisig())
const { fetchSafeInstanceses } = useSafe()
const { mfaTypes, mfaTermsAccepted, preferredMfaType, verifyDeleteRequest, signAndRequestDeleteMfaCode, activateToptMfa } = useMfa()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

async function handleDeactivateWithRecoveryCode(mfa: IMfa, close: () => void) {
  const { success } = await openDeactivateTotpByRecoveryCodes()

  if (success) {
    notify({
      type: 'success',
      message: 'Successfully deactivated TOTP',
    })

    setFallbackDefaultMfaType(mfa)
    fetchSafeInstanceses()
  }

  close()
}

async function handleDeactivate(mfa: IMfa, close: () => void) {
  if (mfa.value !== 'totp') {
    const success = await signAndRequestDeleteMfaCode(mfa)

    if (!success)
      return
  }

  const { success } = await openVerifyMFAModal({
    mfa,
    mfaRequestType: 'delete',
    request: signAndRequestDeleteMfaCode,
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
    const activatedMfa = mfaTypes.value.find(i => i.activated && i.value !== mfa.value)
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
    <div v-if="isSelectedSafeLegacy">
      Legacy Safe is not supported
    </div>
    <div v-else class="flex flex-col gap-7.5">
      <div class="flex flex-col gap-2.5">
        <h1 class="text-[30px] leading-10">
          Configure Avocado Protect ⚔️
        </h1>
        <h2 class="text-sm font-medium leading-6 text-slate-400">
          Avocado Protect is a non-custodial 2FA service which allows you to add an additional layer
          of verification using OT (or a backup address) before a transaction goes through.
        </h2>
        <NuxtLink class="text-sm font-medium text-primary" external to="/">
          Learn more about how it works
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-5">
        <div class="flex flex-col gap-7.5 rounded-5 bg-slate-50 p-7.5 dark:bg-gray-850">
          <div>
            <h2 class="mb-2.5">
              Otp Login
            </h2>
            <h3 class="text-xs font-medium text-slate-400">
              Set up one or more OTP methods & use any one to verify identity at the time of transaction.
            </h3>
          </div>
          <div>
            <ul class="flex flex-col gap-4">
              <li v-for="mfa in mfaTypes" :key="mfa.value">
                <div class="flex h-[66px] w-full items-center justify-between rounded-2xl bg-slate-150 p-5 text-left ring-1 ring-slate-150 dark:bg-slate-850 dark:ring-slate-750">
                  <div class="flex w-full items-center justify-between">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium leading-5">
                        {{ mfa.label }}
                      </span>
                      <span v-if="mfa.value === preferredMfaType" class="text-xs font-medium text-slate-400">
                        Default
                      </span>
                    </div>
                    <span v-if="mfa.activated" class="flex items-center gap-2.5 text-xs font-medium">
                      <template v-if="hasInstadappSigner">
                        <SvgoCheckCircle class="success-circle w-5" />
                        <span class="uppercase text-primary">
                          Active
                        </span>
                      </template>
                      <template v-else>
                        <span class="text-orange">
                          Confirm changes to activate
                        </span>
                      </template>

                      <Popover class="relative inline-flex items-center">
                        <PopoverButton class="group">
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
                            class="absolute -top-24 left-1/2 z-10 flex -translate-x-1/2 flex-col gap-2.5 rounded-2xl border bg-slate-150 py-4 text-sm dark:border-slate-800 dark:bg-gray-900 sm:px-0 lg:max-w-3xl"
                          >
                            <button class="whitespace-nowrap px-5 text-left" @click="handleSetDefault(mfa, close)">
                              Set as default
                            </button>
                            <button class="flex items-center gap-2 px-5 text-red-alert" @click="handleDeactivate(mfa, close)">
                              <SvgoTrash2 /> Deactivate
                            </button>
                            <button v-if="mfa.value === 'totp'" class="flex items-center gap-2 whitespace-nowrap px-5 text-red-alert" @click="handleDeactivateWithRecoveryCode(mfa, close)">
                              <SvgoTrash2 /> Deactivate <span class="text-[10px]">(Recovery Code)</span>
                            </button>
                          </PopoverPanel>
                        </transition>
                      </Popover>
                    </span>
                    <CommonButton v-else @click="handleActivate(mfa)">
                      Activate Now
                    </CommonButton>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div class="flex items-baseline justify-between">
            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium">
                Active on {{ instadappSignerNetworks.length }} networks
              </span>
              <div class="flex">
                <ChainLogo v-for="i in instadappSignerNetworks" :key="i.chainId" class="-ml-2 h-5 w-5 first:ml-0" :chain="i.chainId" />
              </div>
            </div>
            <CommonButton @click="openMfaSignInstadappSignerModal">
              Manage Networks
            </CommonButton>
          </div>
        </div>
        <div class="flex flex-col gap-7.5 rounded-5 bg-slate-50 p-7.5 dark:bg-gray-850">
          <div>
            <h2 class="mb-2.5">
              Backup outh (optional)
            </h2>
            <h3 class="text-xs font-medium text-slate-400">
              In case you don't have access to OTP's, you can use a secondary address to confirm your identity. This ensures you are never locked out of your Avocado Wallet
            </h3>

            <div class="mt-4 flex h-[66px] w-full items-center justify-between rounded-2xl bg-slate-150 p-5 text-left ring-1 ring-slate-150 dark:bg-slate-850 dark:ring-slate-750">
              <div class="flex w-full items-center justify-between">
                <span class="text-xs font-medium leading-5">
                  Secondary Address
                </span>

                <CommonButton>
                  Activate Now
                </CommonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
