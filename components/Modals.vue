<script setup lang="ts">
const { modals } = useModal();
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="modals">
      <Modal
        @destroy="modal.destroy"
        @reject="modal.onReject"
        :key="modal.id"
        :modal-id="modal.id"
        :options="modal.options"
        :inline="false"
        :is-async="modal.async"
        :show="true"
        v-for="modal in modals"
      >
        <component
          :is="modal.component"
          @destroy="modal.destroy"
          @resolve="modal.onResolve"
          @reject="modal.onReject"
          v-bind="modal.componentProps"
        />
      </Modal>
    </TransitionGroup>
  </Teleport>
</template>

<style>
.modals-enter-active .modal-inner {
  @apply ease-outExpo md:ease-in md:duration-100 duration-200;
}

.modals-leave-active .modal-inner {
  @apply ease-outExpo md:ease-out md:duration-100 duration-200;
}

.modals-enter-from .modal-inner,
.modals-leave-to .modal-inner {
  @apply opacity-0 translate-y-96 md:translate-y-0 md:scale-95;
}
</style>
