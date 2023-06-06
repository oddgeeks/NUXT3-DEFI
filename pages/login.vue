<script setup lang="ts">
definePageMeta({
  layout: 'login-free',
})

const router = useRouter()
const route = useRoute()

const redirectTo = route.query?.redirectTo as string
</script>

<template>
  <div
    class="sm:w-[460px] w-full h-full mx-auto mt-10 sm:mt-[92px] py-10 sm:px-[50px] px-5 rounded-[30px] dark:bg-gray-850 bg-white"
  >
    <ModalsWeb3 button-class="dark:bg-slate-800 bg-slate-100" @destroy="router.push(redirectTo || '/')">
      <template #title>
        <div class="mb-7.5">
          <div class="w-full flex justify-center">
            <SvgAvocadoLogo />
          </div>
          <h1 class="mt-5 text-2xl leading-10 font-semibold text-center">
            Connect to Avocado
          </h1>
          <p
            class="text-xs leading-6 font-medium text-center text-slate-400"
          >
            & enjoy the most user-friendly web3 experience!
          </p>
        </div>
      </template>
    </ModalsWeb3>
  </div>
</template>
