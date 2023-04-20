<script setup lang="ts">
const props = defineProps({
  data: {
    type: String,
    required: true,
  },
  size: Number,
  margin: Number,
  mini: Boolean,
})
const canvas = ref<HTMLCanvasElement>()

onMounted(async () => {
  const QRCodeStyling = await import('styled-qr-code')

  // eslint-disable-next-line new-cap
  const qrCode = new QRCodeStyling.default({
    width: props.size,
    height: props.size,
    type: 'svg',
    data: props.data,
    margin: props.margin,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'M' },
    dotsOptions: { type: 'dots', color: '#000000' },
    backgroundOptions: { color: '#ffffff' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
    cornersDotOptions: { type: 'dot', color: '#000000' },
  })

  qrCode.append(canvas.value)
})
</script>

<template>
  <div ref="canvas" :class="`w-[${props.size}px] h-[${props.size}px]`" />
</template>
