<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from "~/assets/images/icons/error-circle.svg?component";
import SVGQuestionCircle from "~/assets/images/icons/question-circle.svg?component";

const { props, closeModal } = useModal();

const handleClick = () => {
  props.value?.callback && props.value.callback();
  closeModal();
};

const handleCancel = () => {
  closeModal();
  props.value?.cancelCallback && props.value.cancelCallback();
};

</script>

<template>
  <div
    class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
  >
    <img v-if="props.headerIconUrl" class="w-10 h-10" width="40" height="40" :src="props.headerIconUrl"/>
    <SVGCheckCircle
      class="text-white success-circle"
      v-else-if="props.type === 'success'"
    />
    <SVGErrorCircle class="text-white" v-else-if="props.type === 'error'" />
    <SVGQuestionCircle v-else-if="props.type === 'question'" />

    <div class="flex flex-col gap-[15px]">
      <h1 class="text-lg">{{ props.title }}</h1>

      <p
        v-html="props.content"
        class="text-slate-400 text-xs text-center leading-5"
      />
    </div>
     <div v-if="props.isCancelButtonVisible || props.isButtonVisible" class="flex w-full gap-4 items-center">
      <CommonButton
      v-if="props.isCancelButtonVisible"
      @click="handleCancel()"
      class="flex-1 justify-center"
      v-bind="props.cancelButtonProps"
      size="lg"
    >
     {{ props.cancelButtonText }}
    </CommonButton>
    <CommonButton
      v-if="props.isButtonVisible"
      @click="handleClick()"
      class="flex-1 justify-center"
      v-bind="props.buttonProps"
      size="lg"
    >
      {{ props.buttonText }}
    </CommonButton>
     </div>
  </div>
</template>
