<script setup lang="ts">
const props = defineProps<{
  connection: any
  loading: boolean
}>()

defineEmits(['connect'])

const isConnectionBanned = computed(() => {
  alert('selam')
  return bannedDapps.some((i) => {
    try {
      const url = new URL(i)
      const hostname = url.hostname
      const peerMetaUrl = new URL(props.connection.peerMeta.url)
      const peerMetaHostname = peerMetaUrl.hostname

      console.log(hostname, peerMetaHostname)

      return hostname === peerMetaHostname
    }
    catch (e) {
      console.log(e)
      return false
    }
  })
})
</script>

<template>
  <form
    v-focus
    tabindex="0"
    class="space-y-8 focus:outline-none"
    @keypress.enter="$emit('connect')"
    @submit.prevent="$emit('connect')"
  >
    {{ isConnectionBanned }}
    selam
    <div class="flex flex-col items-center space-y-8">
      <div v-if="connection.peerMeta.icons.length" class="w-10 h-10">
        <img
          class="w-full h-full object-fit"
          referrerpolicy="no-referrer"
          :src="
            connection.peerMeta.icons[connection.peerMeta.icons.length - 1]
          "
        >
      </div>

      <span> {{ connection.peerMeta.name }} Wants to Connect </span>
    </div>

    <div class="flex flex-col gap-7.5">
      <p class="text-slate-400 text-xs text-center font-medium">
        You need the Avocado web app to be open to initiate transactions. You
        will not receive transaction requests when it is not open.
      </p>

      <div class="text-primary text-sm text-center">
        {{ connection.peerMeta.url }}
      </div>
    </div>

    <div v-if="isConnectionBanned">
      Banned
    </div>

    <CommonButton
      type="submit"
      :disabled="isConnectionBanned"
      :loading="loading"
      class="w-full justify-center"
      size="lg"
    >
      Approve
    </CommonButton>
  </form>
</template>
