<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from "~/assets/images/icons/error-circle.svg?component";
import SVGQuestionCircle from "~/assets/images/icons/question-circle.svg?component";

const emit = defineEmits(["resolve", "reject"]);

defineProps<{
  id?: string;
  title: string;
  content: string;
  type: "success" | "error" | "question";
  headerIconUrl?: string;
  headerIconComponent?: any;
  isButtonVisible?: boolean;
  isCancelButtonVisible?: boolean;
  buttonText?: string;
  cancelButtonText?: string;
  cancelButtonProps?: any;
  buttonProps?: any;
}>();

const handleResolve = () => {
  return emit("resolve", true)
};

const handleReject = () => {
  return emit("reject", false)
};
</script>

<template>
  <div
    class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
  >
  <component v-if="headerIconComponent" :is="headerIconComponent"/>
    <img
      v-else-if="headerIconUrl"
      class="w-10 h-10"
      width="40"
      height="40"
      :src="headerIconUrl"
    />
    <SVGCheckCircle
      class="text-white success-circle"
      v-else-if="type === 'success'"
    />
    <SVGErrorCircle class="text-white w-10 h-10 fill-primary" v-else-if="type === 'error'" />
    <SVGQuestionCircle class="w-10 h-10 text-primary" v-else-if="type === 'question'" />

    <div class="flex flex-col gap-[15px]">
      <h1 v-if="title" class="text-lg font-semibold">{{ title }}</h1>
      <p
        v-if="content"
        v-html="content"
        class="text-slate-400 text-xs text-center leading-5 font-medium"
      />
    </div>
    <div
      v-if="isCancelButtonVisible || isButtonVisible"
      class="flex w-full gap-4 items-center"
    >
      <CommonButton
        v-if="isCancelButtonVisible"
        @click="handleReject()"
        class="flex-1 justify-center"
        v-bind="cancelButtonProps"
        size="lg"
      >
        {{ cancelButtonText }}
      </CommonButton>
      <CommonButton
        v-if="isButtonVisible"
        @click="handleResolve()"
        class="flex-1 justify-center"
        v-bind="buttonProps"
        size="lg"
      >
        {{ buttonText }}
      </CommonButton>
    </div>
  </div>
</template>
