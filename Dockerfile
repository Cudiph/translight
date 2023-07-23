FROM node:18-alpine

WORKDIR /usr/src/translight

COPY package.json .

RUN npm install -g pnpm

RUN pnpm install

COPY . .

CMD ["pnpm", "build"]
