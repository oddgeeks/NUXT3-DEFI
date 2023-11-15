import { breakpointsTailwind } from '@vueuse/core'

const hidden = ref<boolean>(true)
const collapsed = ref(false)

export function useSidebar() {
  const route = useRoute()

  const width = 340
  const collapsedWidth = 120
  const hiddenWidth = 0

  const breakPoints = useBreakpoints(breakpointsTailwind)
  const isMobile = computed(() => breakPoints.smaller('sm').value)

  const collapse = () => collapsed.value = true
  const expand = () => collapsed.value = false
  const toggleCollapse = () => collapsed.value = !collapsed.value

  const actualWidth = computed(() => {
    if (route.meta?.layout === 'login-free')
      return hiddenWidth

    if (isMobile.value && hidden.value)
      return hiddenWidth

    if (isMobile.value)
      return width

    return collapsed.value ? collapsedWidth : width
  })

  const hideSidebar = () => hidden.value = true
  const toggleHideSidebar = () => hidden.value = !hidden.value

  return {
    collapsed,
    collapse,
    expand,
    width,
    hidden,
    toggleCollapse,
    actualWidth,
    collapsedWidth,
    hideSidebar,
    toggleHideSidebar,
    isMobile,
  }
}
