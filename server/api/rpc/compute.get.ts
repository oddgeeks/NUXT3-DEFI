import { object, string } from 'yup'
import { getServerBatchedRpcProvider } from '@/server/utils/safe'

export default defineEventHandler(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
  })

  await schema.validate(params)

  const { address } = schema.cast(params)

  if (!address) {
    return createError({
      message: 'Address is required',
      statusCode: 500,
    })
  }

  const provider = getServerBatchedRpcProvider(137)

  return getComputedAddresses(provider, address)
})
