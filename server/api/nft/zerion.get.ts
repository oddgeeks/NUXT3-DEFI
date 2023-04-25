import { Buffer } from 'node:buffer'
import { array, object, string } from 'yup'

export default defineEventHandler<NFTData[]>(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    chains: array().default([]).min(1).required(),
  })

  const username = 'certel@hotmail.com'
  const password = 'zk_dev_aaf0f85786ca4e4fb0b3fbfec0e56e17'

  // Combine the username and password with a colon separator
  const combined = `${username}:${password}`

  // Convert the combined string to base64
  const base64Encoded = Buffer.from(combined).toString('base64')

  console.log(base64Encoded)

  await schema.validate(params)

  const { chains, address } = schema.cast(params)

  return []
})
