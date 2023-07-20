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
    <p class="text-[18px] leading-[25px] font-semibold">
      Update Avocado
    </p>
    <p class="mt-[12px] text-slate-400 text-center text-[12px] leading-[20px]">
      New Avocado version available. Please update to a newer version to ensure seamless experience & access to latest features.
    </p>
    <div class="w-full mt-[30px] flex flex-col-reverse md:flex-row items-center justify-center gap-[16px] md:gap-2">
      <CommonButton color="white" class="w-full md:flex-1 justify-center text-sm rounded-full" @click="onRemindLater()">
        Remind me later
      </CommonButton>
      <CommonButton class="w-full md:flex-1 justify-center text-sm rounded-full" @click="onUpdateBtn()">
        Update Now
      </CommonButton>
    </div>
  </div>
</template>
