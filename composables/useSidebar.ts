import { breakpointsTailwind } from '@vueuse/core'

const hidden = ref<boolean>(true)

export function useSidebar() {
  const width = 340
  const collapsedWidth = 120
  const hiddenWidth = 0

  const collapsed = useCookie<boolean>('sidebar-collapsed', {
    default() {
      return false
    },
  })

  const breakPoints = useBreakpoints(breakpointsTailwind)
  const isMobile = computed(() => breakPoints.smaller('sm').value)

  const collapse = () => collapsed.value = true
  const expand = () => collapsed.value = false
  const toggleCollapse = () => collapsed.value = !collapsed.value

  const actualWidth = computed(() => {
    if (isMobile.value && hidden.value)
      return hiddenWidth

    if (isMobile.value)
      return width

    return collapsed.value ? collapsedWidth : width
  })

  const hideSidebar = () => hidden.value = true
  const toggleHideSidebar = () => hidden.value = !hidden.value

  const layoutStyle = computed(() => {
    if (process.server)
      return

    if (isMobile.value) {
      return {
        transform: `translateX(${actualWidth.value}px)`,
      }
    }
    return {
      marginLeft: `${actualWidth.value}px`,
    }
  })

  return {
    collapsed,
    collapse,
    expand,
    width,
    hidden,
    toggleCollapse,
    actualWidth,
    collapsedWidth,
    layoutStyle,
    hideSidebar,
    toggleHideSidebar,
    isMobile,
  }
}
