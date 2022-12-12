<script setup>
const { safeAddress } = useAvocadoSafe()
</script>


<template>
    <div class="space-y-8">
        <div>
            <TotalBalance />
        </div>

        <div class="md:flex space-between gap-5">
            <Balances class="w-full mb-5 md:mb-0 md:pb-14" />

            <div class="md:w-56 flex-shrink-0 space-y-5">
                <QrCode />
                <WalletConnect />
            </div>
        </div>
    </div>
</template>