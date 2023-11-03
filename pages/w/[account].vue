<script setup lang="ts">
import ExclamationCircleSVG from '~/assets/images/icons/exclamation-circle.svg?component'

definePageMeta({
  layout: 'login-free',
})

const { isSafeAddress } = useAvocadoSafe()

const router = useRoute()
const account = router.params.account as string

if (!(await isSafeAddress(account)))
  throw createError({ statusCode: 404, message: 'Invalid address or Avocado wallet not deployed yet' })
</script>

<template>
  <div class="container flex-1">
    <div class="flex items-center justify-center md:py-32">
      <div
        class="flex flex-col justify-start space-y-6 rounded-5.5 bg-slate-50 p-5 dark:bg-gray-850 md:flex-row md:space-x-6 md:space-y-0 md:p-10"
      >
        <div class="flex items-start">
          <StyledQrCode
            :key="account"
            class="mx-auto overflow-hidden rounded-5 bg-white"
            :size="160"
            :margin="7"
            :data="account"
          />
        </div>
        <div class="flex flex-col space-y-5">
          <div class="inline-flex gap-2.5 font-semibold sm:items-center">
            <ExclamationCircleSVG class="mt-1 h-4 w-4 text-primary sm:mt-0" />
            <span class="flex-1 text-xs font-medium leading-5">
              Please use the following details to send me funds!
            </span>
          </div>

          <Copy
            class="text-wrap flex items-center justify-between gap-2 rounded-5 bg-slate-100 px-4 py-3 text-left text-xs dark:bg-gray-900"
            :text="account"
          >
            <template #content>
              {{ account }}
            </template>
          </Copy>

          <span class="inline-flex gap-2.5 text-xs font-semibold">
            Supported Chains
          </span>
          <SupportedChains class="!flex justify-between" />
        </div>
      </div>
    </div>
  </div>
</template>
