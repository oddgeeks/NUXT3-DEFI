<script lang="ts">
export default defineComponent({
  name: 'VFlag',
  props: {
    flag: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const comp = shallowRef(null)

    watch(() => props.flag, () => {
      try {
        comp.value = defineAsyncComponent(() => import(`../node_modules/country-flag-icons/3x2/${props.flag}.svg`))
      }
      catch {
        comp.value = 'span'
      }
    }, {
      immediate: true,
    })

    return () => h(comp.value)
  },
})
</script>
