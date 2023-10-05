<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { isSelectedSafeLegacy } = storeToRefs(useSafe())
const { hasInstadappSigner } = storeToRefs(useMultisig())
const { fetchSafeInstanceses } = useSafe()
const { mfaTypes, mfaTermsAccepted, preferredMfaType, verifyDeleteRequest } = useMfa()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

async function handleDeactivateWithRecoveryCode(close: () => void) {
  const { success } = await openDeactivateTotpByRecoveryCodes()

  if (success) {
    notify({
      type: 'success',
      message: 'Successfully deactivated OTPT',
    })
    fetchSafeInstanceses()
  }

  close()
}

async function handleDeactivate(mfa: IMfa, close: () => void) {
  const { success, payload } = await openVerifyMFAModal(mfa, 'delete')

  if (!success || !payload.code)
    return

  const verified = await verifyDeleteRequest(mfa, payload.code)

  if (verified) {
    notify({
      type: 'success',
      message: `Successfully deactivated ${mfa.label}`,
    })

    if (preferredMfaType.value === mfa.value)
      preferredMfaType.value = undefined

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

async function handleActivate(mfa: IMfa) {
  if (!mfaTermsAccepted.value) {
    const { success } = await openMfaTermsModal()

    if (!success)
      return
  }

  openMfaActivateModal({ mfaType: mfa })
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
      <div class="flex flex-col gap-7.5 rounded-5 bg-slate-50 p-7.5 dark:bg-gray-850">
        <div>
          <h2 class="mb-2.5">
            Set up 2FA methods
          </h2>
          <h3 class="text-xs font-medium text-slate-400">
            You can set up multiple modes of verification and later use any method to confirm your identity.
          </h3>
        </div>
        <div>
          <ul class="grid grid-cols-2 gap-4">
            <li v-for="mfa in mfaTypes" :key="mfa.value">
              <div class="flex h-[66px] w-full items-center justify-between rounded-2xl bg-slate-150 p-5 text-left ring-1 ring-slate-150 dark:bg-slate-850 dark:ring-slate-750">
                <div class="flex w-full items-center justify-between">
                  <span class="text-xs font-medium leading-5">
                    {{ mfa.label }}
                  </span>
                  <span v-if="mfa.activated" class="flex items-center gap-2.5 text-xs uppercase ">
                    <SvgoCheckCircle class="success-circle w-5" />
                    <span class="text-primary">
                      Active
                    </span>

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
                          <button v-if="mfa.value === 'totp'" class="flex items-center gap-2 whitespace-nowrap px-5 text-red-alert" @click="handleDeactivateWithRecoveryCode(close)">
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
      </div>

      <div v-if="!hasInstadappSigner" class="flex flex-col items-center justify-center gap-[14px]">
        <span class="text-xs font-medium text-slate-400">
          One or more changes yet to be confirmed
        </span>

        <CommonButton
          size="lg" class="w-fit" @click="openAddSignerModal({
            threshold: 2,
            addresses: [
              {
                address: instadappSigner,
                name: 'Instadapp Signer',
              },
            ],
          })"
        >
          Confirm Changes
        </CommonButton>
      </div>
    </div>
  </div>
</template>
