<template>
  <Teleport to="body">
    <div class="relative z-[9999999999] flex flex-col gap-2.5">
      <div :class="transactionsQueue.length ? 'pointer-events-auto' : 'pointer-events-none'" class="md:pb-22.5 fixed bottom-0 right-0 z-20 flex p-5 md:p-5">
        <TransitionGroup class="flex flex-col gap-2.5" name="list" tag="ul">
          <TransactionsQueueItem
            v-for="item in transactionsQueue" :key="item.hash"
            :transaction-param="item"
          />
        </TransitionGroup>
      </div>
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
