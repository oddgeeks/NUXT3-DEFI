const opened = ref(true)

export function useSidebar() {
  const openSidebar = () => {
    opened.value = true
  }

  const closeSidebar = () => {
    opened.value = false
  }

  const toggleSidebar = () => {
    opened.value = !opened.value
  }

  return {
    opened,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
}
