<script setup lang="ts">
import { pathToRegexp } from 'path-to-regexp'

definePageMeta({
  layout: 'login-free',
})

const router = useRouter()
const route = useRoute()

const redirectTo = route.query?.redirectTo as string

function handleDestroy() {
  if (!redirectTo) {
    router.push({ path: '/' })
    return
  }

  const routes = router.getRoutes()
  let isValid = false

  try {
    for (const page of routes) {
      const path = page.path.replaceAll('()', '')
      const regexp = pathToRegexp(path)

      isValid = regexp.test(redirectTo)

      if (isValid) {
        router.push({ path: redirectTo })
        return
      }
    }
  }
  catch (error) {
    router.push('/')
    return
  }

  router.push('/')
}
</script>

<template>
  <div
    class="mx-auto mt-10 h-full w-full rounded-[30px] bg-gray-850 px-5 py-10 sm:mt-[92px] sm:w-[460px] sm:px-[50px]"
  >
    <ModalsWeb3 button-class="bg-gray-900" @destroy="handleDestroy">
      <template #title>
        <div class="mb-7.5">
          <SvgoAvocadoLogoMini class="mx-auto h-12 w-12" />

          <h1 class="mt-5 text-center text-2xl font-semibold leading-10">
            Connect to Avocado
          </h1>
          <p
            class="text-center text-xs font-medium leading-6 text-gray-400"
          >
            & enjoy the most user-friendly web3 experience!
          </p>
        </div>
      </template>
    </ModalsWeb3>
  </div>
</template>
