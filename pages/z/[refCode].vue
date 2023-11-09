<script setup lang="ts">
const route = useRoute()

const referalCode = useCookie<string>('ref-code')
const refCode = route.params.refCode as string
const connectionMeta = useCookie<IConnectionMeta | undefined>('connection-meta')

if (refCode) {
  referalCode.value = refCode
  connectionMeta.value = undefined
}

navigateTo('/login')
</script>
