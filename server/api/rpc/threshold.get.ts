import { object, string } from 'yup'
import type { Provider } from '@ethersproject/providers'
import { serialize } from 'error-serializer'
import { AvoMultisigImplementation__factory } from '@/contracts'

export default defineEventHandler<Promise<number>>(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    chainId: string().required(),
  })

  await schema.validate(params)

  const { address, chainId } = schema.cast(params)

  if (!address || !chainId)
    throw new Error('Invalid params')

  try {
    const requiredSigner = await getRequiredSignerByProvider(address, getServerRpcProvider(chainId))
    return requiredSigner
  }
  catch (e) {
    const error = serialize(e)
    console.log(error?.message)
    return 1
  }
})

async function getRequiredSignerByProvider(address: string, provider: Provider) {
  const instance = AvoMultisigImplementation__factory.connect(address, provider)
  const requiredSigner = await instance.requiredSigners()
  return requiredSigner
}
