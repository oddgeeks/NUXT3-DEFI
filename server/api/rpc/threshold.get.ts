import { object, string } from 'yup'
import type { Provider } from '@ethersproject/providers'
import { StaticJsonRpcRetryProvider } from '@instadapp/utils'
import { serialize } from 'error-serializer'
import { AvoMultisigImplementation__factory } from '@/contracts'

export default defineEventHandler<Promise<number>>(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    rpcURL: string().required(),
    chainId: string().required(),
  })

  await schema.validate(params)

  const { rpcURL, address, chainId } = schema.cast(params)

  if (!address || !rpcURL || !chainId)
    throw new Error('Invalid params')

  const publicProvider = new StaticJsonRpcRetryProvider(rpcURL)
  const paidProvider = getServerRpcProvider(chainId)

  try {
    const requiredSigner = await getRequiredSignerByProvider(address, publicProvider)
    return requiredSigner
  }
  catch (e) {
    const error = serialize(e)

    // return default if the multisig is not deployed
    if (error?.code === 'CALL_EXCEPTION')
      return 1

    console.log('Fallback into paid provider')

    try {
      const requiredSigner = await getRequiredSignerByProvider(address, paidProvider)
      return requiredSigner
    }
    catch (e) {
      console.log('Fallback into default')
      return 1
    }
  }
})

async function getRequiredSignerByProvider(address: string, provider: Provider) {
  const instance = AvoMultisigImplementation__factory.connect(address, provider)
  const requiredSigner = await instance.requiredSigners()
  return requiredSigner
}
