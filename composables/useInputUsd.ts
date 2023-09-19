const isInputUsd = useLocalStorage('inputUsdToggle', false)

export function useInputUsd() {
  return {
    isInputUsd,
  }
}
