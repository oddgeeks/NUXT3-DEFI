<script lang="ts" setup>
const emit = defineEmits(['destroy'])
const router = useRouter()
const lastNoticeShowDate = useLocalStorage('last_update_notice_show_date', new Date(0, 0))

function onRemindLater() {
  lastNoticeShowDate.value = new Date()
}

function onUpdateBtn() {
  router.push('/upgrade')
  emit('destroy')
}

watch(lastNoticeShowDate, () => {
  emit('destroy')
})
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <p>
      Update Avocado
    </p>
    <p class="mt-5 text-slate-400 text-center text-sm">
      New Avocado version available. Please update to a newer version to ensure seamless experience & access to latest features.
    </p>
    <div class="w-full mt-8 flex flex-row items-center justify-center gap-2">
      <CommonButton color="white" class="flex-1 justify-center text-sm" @click="onRemindLater()">
        Remind me later
      </CommonButton>
      <CommonButton class="flex-1 justify-center text-sm" @click="onUpdateBtn()">
        Update now
      </CommonButton>
    </div>
  </div>
</template>
