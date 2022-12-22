# Avocado App

An interface for Avocado platform that makes web3 interaction easy by enabling network, gas and account abstraction allowing you to experience web3 more seamlessly.

## Adding Tokenlist

Add the token id in `coinIds` array at [scripts/token-list.ts](https://github.com/Instadapp/avocado/blob/master/scripts/token-list.ts) and run `yarn generate:tokenlist`. The script will take a few minutes tio fetch decimals and logo URI. Please make sure the token id is outsourced from Coingecko.

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install --shamefully-hoist
```

## Development Server

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
