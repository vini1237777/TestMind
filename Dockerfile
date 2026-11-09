# Production image. Railway builds this file (see railway.json).
# Multi stage, so the final image holds only Next's standalone output and the worker.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

RUN npm run build
RUN npm run build:worker

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Standalone output leaves out public/, so copy it (tour screenshots, icons)
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/generation-worker.cjs ./generation-worker.cjs
COPY ecosystem.config.js /app/

RUN npm install pm2 -g

EXPOSE 8080

CMD ["pm2-runtime", "ecosystem.config.js"]
