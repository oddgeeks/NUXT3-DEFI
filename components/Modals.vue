<script setup lang="ts">
const { modals } = useModal()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup :duration="300" name="modals">
      <Modal
        v-for="modal in modals"
        :key="modal.id"
        :modal-id="modal.id"
        :options="modal.options"
        :inline="false"
        :is-async="modal.async"
        :show="true"
        @destroy="modal.destroy"
        @reject="modal.onReject"
      >
        <component
          :is="modal.component"
          v-bind="modal.componentProps"
          @destroy="modal.destroy"
          @resolve="modal.onResolve"
          @reject="modal.onReject"
        />
      </Modal>
    </TransitionGroup>
  </Teleport>
</template>

<style>
.modals-enter .modal-inner {
  @apply ease-out duration-300 sm:duration-200;
}

.modals-enter-active .modal-inner,
.modals-leave-active .modal-inner,
.modals-leave .modal-inner {
  @apply ease-in duration-300 sm:duration-200;
}

.modals.leave-from .modal-inner,
.modals-enter-to .modal-inner {
  @apply opacity-100 translate-y-0 sm:scale-100;
}

.modals-enter-from .modal-inner,
.modals-leave-to .modal-inner {
  @apply opacity-0 translate-y-96 sm:translate-y-0 sm:scale-95;
}

.modals-enter-from .modal-inner[data-sheet-position="top"],
.modals-leave-to .modal-inner[data-sheet-position="top"] {
  @apply opacity-0 -translate-y-32 sm:translate-y-0 sm:scale-95;
}
</style>
