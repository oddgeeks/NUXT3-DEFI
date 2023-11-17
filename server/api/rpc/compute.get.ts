import { boolean, object, string } from 'yup'
import { getServerBatchedRpcProvider } from '@/server/utils/safe'

export default defineEventHandler(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    is_prod: boolean().default(true),
  })

  await schema.validate(params)

  const { address, is_prod } = schema.cast(params)

  console.log({ isProdComputed: is_prod })

  if (!address) {
    return createError({
      message: 'Address is required',
      statusCode: 500,
    })
  }

  const provider = getServerBatchedRpcProvider(137)

  return getComputedAddresses({
    accountAddress: address,
    provider,
    isProd: is_prod,
  })
})
