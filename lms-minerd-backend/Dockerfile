FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma

RUN npm ci

RUN npx prisma generate

COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma db push --accept-data-loss && (SEED_MODE=production npx ts-node -r tsconfig-paths/register prisma/seed.ts || true) && node dist/main"]
