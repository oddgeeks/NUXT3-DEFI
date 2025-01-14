export function useEagerConnect() {
  const { activate, active } = useWeb3()
  const { getConnector } = useConnectors()

  const tried = ref(false)

  onNuxtReady(() => {
    const connector = getConnector()
    connector && activate(connector, undefined, true).catch(() => {
      tried.value = true
    })

    // injected.isAuthorized().then((isAuthorized: boolean) => {
    //   if (isAuthorized) {
    //     activate(injected, undefined, true).catch(() => {
    //       tried.value = true;
    //     });
    //   } else {
    //     tried.value = true;
    //   }
    // });
  })

  // if the connection worked, wait until we get confirmation of that to flip the flag
  watch([tried, active], () => {
    if (!tried.value && active.value)
      tried.value = true
  }, { immediate: true })

  return {
    tried,
  }
}
