<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { isSelectedSafeLegacy } = storeToRefs(useSafe())
const { mfaTypes, mfaTermsAccepted, mfaModes, mfaMode, actualMfaMode } = useMfa()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useState('signer-steps', defaultSteps)

async function handleActivate(mfa: IMfa) {
  if (!mfaTermsAccepted.value) {
    const { success } = await openMfaTermsModal()

    if (!success)
      return
  }

  openMfaActivateModal({ mfaType: mfa })
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
        <h2 class="font-medium text-sm text-slate-400 leading-6">
          Avocado Protect is a non-custodial 2FA service which allows you to add an additional layer
          of verification using OT (or a backup address) before a transaction goes through.
        </h2>
        <NuxtLink class="text-primary text-sm font-medium" external to="/">
          Learn more about how it works
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-5">
        <div class="rounded-5 flex flex-col gap-7.5 dark:bg-gray-850 bg-slate-50 p-7.5">
          <div>
            <h2 class="mb-2.5">
              Set up 2FA methods
            </h2>
            <h3 class="font-medium text-xs text-slate-400">
              You can set up multiple modes of verification and later use any method to confirm your identity.
            </h3>
          </div>
          <div>
            <ul class="flex flex-col gap-4">
              <li v-for="mfa in mfaTypes" :key="mfa.value">
                <div class="dark:bg-slate-850 text-left flex items-center justify-between h-[66px] bg-slate-150 ring-1 rounded-2xl dark:ring-slate-750 ring-slate-150 w-full p-5">
                  <div class="flex items-center justify-between w-full">
                    <span class="leading-5 font-medium text-xs">
                      {{ mfa.label }}
                    </span>
                    <span v-if="mfa.activated" class="flex items-center text-xs uppercase gap-2.5 text-primary">
                      <SvgoCheckCircle class="success-circle w-5" />
                      Active

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
                            class="absolute left-1/2 z-10 -top-14 -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl"
                          >
                            <div class="dark:bg-slate-750 flex items-center gap-2.5 text-red-alert px-5 rounded-2xl py-4 bg-slate-150">
                              <SvgoTrash2 /> Deactivate
                            </div>
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
        <div class="rounded-5 flex flex-col gap-7.5 dark:bg-gray-850 bg-slate-50 p-7.5">
          <div>
            <h2 class="mb-2.5">
              Your preferred 2FA Mode
            </h2>
            <h3 class="font-medium text-xs text-slate-400">
              You can change this anytime later in 2FA settings.
            </h3>
          </div>

          <ul class="flex flex-col gap-4">
            <li v-for="mode in mfaModes" :key="mode.value">
              <button :class="mfaMode === mode.value ? 'ring-primary' : 'dark:ring-slate-750 ring-slate-150'" class="dark:bg-slate-850 text-left flex items-center justify-between bg-slate-150 ring-1 rounded-2xl  w-full p-5" @click="mfaMode = mode.value">
                <div class="flex flex-col justify-between w-full gap-4">
                  <div class="leading-5 flex gap-2.5 font-medium text-xs">
                    {{ mode.title }}
                    <span v-if="mode.recommended" class="bg-primary font-medium text-xs bg-opacity-10 text-primary px-2 h-5 inline-flex items-center justify-center rounded-md">
                      Recommended
                    </span>
                  </div>
                  <p class="font-medium text-slate-400 text-sm !leading-5">
                    {{ mode.description }}
                  </p>
                </div>
              </button>
            </li>
          </ul>
          <p class="flex h-8 text-orange-400 font-medium text-xs gap-2">
            <SvgoInfo2 class="mt-0.5" />
            Mode will be changed to '{{ actualMfaMode?.title }}' once changes
            are confirmed
          </p>
        </div>
      </div>
      <div class="flex justify-center items-center flex-col gap-[14px] mt-7.5">
        <span class="text-xs font-medium text-slate-400">
          One or more changes yet to be confirmed
        </span>

        <CommonButton
          size="lg" class="w-fit" @click="openAddSignerModal({
            addresses: [
              {
                address: '0xEA524E38e56c48789e27E78f9FF9F33BD0dd530E',
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
