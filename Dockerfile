FROM node:18 AS build
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/build/ /usr/src/app

RUN yarn install --production

CMD [ "node", ".output/server/index.mjs" ]
