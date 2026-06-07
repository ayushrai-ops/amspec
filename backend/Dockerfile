FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN cp prisma/schema.prisma.postgres prisma/schema.prisma && npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm start"]
