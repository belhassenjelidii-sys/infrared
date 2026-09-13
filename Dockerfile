FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 infrared \
  && adduser --system --uid 1001 --ingroup infrared infrared
COPY --chown=infrared:infrared --from=builder /app/public ./public
COPY --chown=infrared:infrared --from=builder /app/.next/standalone ./
COPY --chown=infrared:infrared --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/public/uploads \
  && chown -R infrared:infrared /app/public/uploads
USER infrared
EXPOSE 3000
CMD ["node", "server.js"]
