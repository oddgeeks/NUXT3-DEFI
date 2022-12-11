/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  BalanceResolver,
  BalanceResolverInterface,
} from "../BalanceResolver";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "tknAddress",
        type: "address[]",
      },
    ],
    name: "getAllowances",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "tknAddress",
        type: "address[]",
      },
    ],
    name: "getBalances",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "owners",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "getBalancesOfOwners",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "balances",
            type: "uint256[]",
          },
        ],
        internalType: "struct Resolver.BalanceReturnData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address[]",
            name: "tokens",
            type: "address[]",
          },
        ],
        internalType: "struct Resolver.BalanceData[]",
        name: "datas",
        type: "tuple[]",
      },
    ],
    name: "getBalancesOfOwnersWithTokens",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "balances",
            type: "uint256[]",
          },
        ],
        internalType: "struct Resolver.BalanceReturnData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "tknAddress",
        type: "address[]",
      },
    ],
    name: "getTokenDetails",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "isToken",
            type: "bool",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "decimals",
            type: "uint256",
          },
        ],
        internalType: "struct Resolver.TokenData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class BalanceResolver__factory {
  static readonly abi = _abi;
  static createInterface(): BalanceResolverInterface {
    return new utils.Interface(_abi) as BalanceResolverInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BalanceResolver {
    return new Contract(address, _abi, signerOrProvider) as BalanceResolver;
  }
}
