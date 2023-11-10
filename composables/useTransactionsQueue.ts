export const transactionsQueue = ref<IPendingTransactionModalParams[]>([])

export function addTransactionToQueue(params: IPendingTransactionModalParams) {
  const isAlreadyInQueue = transactionsQueue.value.some(v => v.hash === params.hash)

  if (isAlreadyInQueue)
    return

  transactionsQueue.value.push(params)
}

export function removeTransactionFromQueue(hash: string) {
  transactionsQueue.value = transactionsQueue.value.filter(v => v.hash !== hash)
}
