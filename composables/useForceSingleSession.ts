export function useForceSingleSession() {
  if (process.server)
    return

  const bc = new BroadcastChannel('avocado_tab_channel')

  bc.addEventListener('message', (event) => {
    // alert(
    //   'Avocado is open in another window. Click "Use Here" to use Avocado in this window.'
    // );
  })

  bc.postMessage('tab_opened')

  onUnmounted(() => {
    bc.close()
  })
}
