<script setup>
</script>

<template>
    <div>
        <div class="py-8 px-10">
            <TheHeader />
        </div>

        <div class="max-w-5xl 2xl:max-w-7xl mx-auto px-10">
            <SwitchNetwork class="mb-8"/>
            
            <slot />
        </div>
    </div>
</template>