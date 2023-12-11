<script lang="ts" setup>
const emit = defineEmits(['resolve'])
const router = useRouter()
const lastNoticeShowDate = useLocalStorage('last_update_notice_show_date', new Date(0, 0))

function onRemindLater() {
  lastNoticeShowDate.value = new Date()
}

function onUpdateBtn() {
  router.push('/upgrade')
  emit('resolve', true)
}

watch(lastNoticeShowDate, () => {
  emit('resolve', true)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <p class="text-[18px] font-semibold leading-[25px]">
      Update Avocado
    </p>
    <p class="mt-[12px] text-center text-[12px] leading-[20px] text-gray-400">
      New Avocado version available. Please update to a newer version to ensure seamless experience & access to latest features.
    </p>
    <div class="mt-[30px] flex w-full flex-col-reverse items-center justify-center gap-[16px] md:flex-row md:gap-2">
      <CommonButton color="white" class="w-full justify-center rounded-full text-sm md:flex-1" @click="onRemindLater()">
        Remind me later
      </CommonButton>
      <CommonButton class="w-full justify-center rounded-full text-sm md:flex-1" @click="onUpdateBtn()">
        Update Now
      </CommonButton>
    </div>
  </div>
</template>
