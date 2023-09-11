import { TransactionBuilder } from '@instadapp/transaction-builder'

export async function parseTransactionObject(formValues: BatchFormValues, buildMode: TxBuilderModes) {
  const _builder = new TransactionBuilder(JSON.parse(JSON.stringify(formValues.abi)))

  const args = buildMode === 'super-collapse'
    ? tryJsonParse(formValues.params || '')
    : _builder.getMethodInputs(formValues.method).map((i) => {
      if (!i.name)
        throw new Error('Invalid input')

      const value = tryJsonParse(formValues[i.name])

      return value
    })

  const data = await _builder.build(formValues.method, args)

  const tx: TransactionsAction = {
    data,
    operation: '0',
    value: String(formValues.ethValue || '0'),
    to: formValues.toAddress,
  }

  return tx
}

export async function parseJsonFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = (event: any) => resolve(JSON.parse(event.target.result))
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}
