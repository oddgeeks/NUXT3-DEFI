<script setup lang="ts">
const props = defineProps({
    data: {
        type: String,
        required: true
    }
})
const canvas = ref<HTMLCanvasElement>()

onMounted(async () => {
    const QRCodeStyling = await import("styled-qr-code")

    const qrCode = new QRCodeStyling.default({
        "width": 140,
        "height": 140,
        type: "svg",
        "data": props.data,
        "margin": 7,
        "qrOptions": { "typeNumber": 0, "mode": "Byte", "errorCorrectionLevel": "M" },
        "dotsOptions": { "type": "dots", "color": "#000000" },
        "backgroundOptions": { "color": "#ffffff" },
        "cornersSquareOptions": { "type": "extra-rounded", "color": "#000000" },
        "cornersDotOptions": { "type": "dot", "color": "#000000" },
    });

    qrCode.append(canvas.value);
})
</script>
<template>
    <div class="w-[140px] h-[140px]" ref="canvas" />
</template>