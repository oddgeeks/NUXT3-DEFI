<script setup>
</script>

<template>
    <div>
        <div class="py-8 px-10">
            <TheHeader />
        </div>

        <SwitchNetwork />

        <div class="max-w-5xl 2xl:max-w-7xl mx-auto py-8 px-10">

            <slot />
        </div>
    </div>
</template>