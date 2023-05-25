import { defineStore } from 'pinia'
const { account } = useWeb3()

export const getAccount = defineStore('account', () => {
  return {
    account
  }
})