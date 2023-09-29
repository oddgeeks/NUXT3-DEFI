export const typesV1 = {
  Cast: [
    { name: 'actions', type: 'Action[]' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'source', type: 'address' },
    { name: 'metadata', type: 'bytes' },
    { name: 'avoSafeNonce', type: 'uint256' },
  ],
  Action: [
    { name: 'target', type: 'address' },
    { name: 'data', type: 'bytes' },
    { name: 'value', type: 'uint256' },
  ],
}

export const typesV2 = {
  Cast: [
    { name: 'actions', type: 'Action[]' },
    { name: 'params', type: 'CastParams' },
    { name: 'avoSafeNonce', type: 'uint256' },
  ],
  Action: [
    { name: 'target', type: 'address' },
    { name: 'data', type: 'bytes' },
    { name: 'value', type: 'uint256' },
    { name: 'operation', type: 'uint256' },
  ],
  CastParams: [
    { name: 'validUntil', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'source', type: 'address' },
    { name: 'id', type: 'uint256' },
    { name: 'metadata', type: 'bytes' },
  ],
}
