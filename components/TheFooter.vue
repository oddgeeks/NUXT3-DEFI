<script setup lang="ts">
import InstadappSVG from "~/assets/images/logo/instadapp.svg?component";

const info = useBuildInfo();

onMounted(() => {
  console.log(
    `%cAvocado v${info.version} (${info.commit.slice(0, 8)})`,
    "color: white; background: #16a34a; font-size: 70px;padding: 10px;text-shadow: 2px 2px black;"
  );
});
</script>

<template>
  <footer class="py-8 mt-24 px-10 flex items-center justify-between">
    <figure class="flex gap-3 items-center">
      <figcaption class="text-xs text-slate-400">
        Built by
      </figcaption>
      <a target="_blank" href="https://instadapp.io/">
        <InstadappSVG />
      </a>
    </figure>

    <nav class="flex gap-10 text-xs text-slate-400">
      <a target="_blank" href="https://help.avocado.instadapp.io">Help</a>
      <a href="mailto:info@instadapp.io">Email</a>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://twitter.com/instadapp"
        >Twitter</a
      >
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://discord.com/invite/C76CeZc"
        >Discord</a
      >
    </nav>
  </footer>
</template>
