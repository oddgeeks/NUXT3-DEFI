<script setup lang="ts">
import InstadappSVG from '~/assets/images/logo/instadapp.svg?component'

const info = useBuildInfo()
const { isProd } = storeToRefs(useEnvironmentState())

onMounted(() => {
  // console.clear()
  console.log(
    `%cAvocado v${info.version} (${info.commit.slice(0, 8)}.${isProd.value ? 'PROD' : 'STAGING'})`,
    'color: white; background: #07A65D; font-size: 32px;padding: 8px;text-shadow: 2px 2px black;',
  )
})
</script>

<template>
  <footer class="mt-24 hidden items-center justify-between px-10 py-8 sm:flex">
    <figure class="flex items-center gap-3">
      <figcaption class="text-xs text-gray-400">
        Built by
      </figcaption>
      <a target="_blank" href="https://instadapp.io/">
        <InstadappSVG />
      </a>
    </figure>

    <nav class="flex gap-10 text-xs text-gray-400">
      <a target="_blank" href="https://guides.avocado.instadapp.io">Help</a>
      <a href="mailto:info@instadapp.io">Email</a>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://twitter.com/instadapp"
      >Twitter</a>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://discord.com/invite/C76CeZc"
      >Discord</a>
    </nav>
  </footer>
</template>
