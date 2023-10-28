<script setup lang="ts">
const { positionedNotifications } = useNotification()

const positionClasses: any = {
  'top-start': 'top-0 left-0',
  'top-end': 'top-0 right-0',
  'bottom-start': 'bottom-0 left-0',
  'bottom-end': 'bottom-0 right-0',
  'top-center': 'left-1/2 -translate-x-1/2',
  'center': 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2',
}
</script>

<template>
  <Teleport to="body">
    <div class="relative z-[9999999999] flex flex-col gap-2.5">
      <TransitionGroup name="list">
        <div
          v-for="(notifications, position) in positionedNotifications"
          :key="position"
          class="md:pb-22.5 fixed z-20 flex p-5 md:p-5"
          :class="positionClasses[position]"
        >
          <TransitionGroup class="flex flex-col gap-2.5" name="list" tag="ul">
            <NotificationsItem
              v-for="item in notifications"
              :key="item.id"
              :item="item"
            />
          </TransitionGroup>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
