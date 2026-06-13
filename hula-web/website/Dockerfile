# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Set API_URL at build time for Next.js middleware (standalone mode)
ARG API_URL=http://hula_app:3000
ENV API_URL=${API_URL}

# IMPORTANT: NEXT_PUBLIC_* variables must be set at BUILD time for client-side code
ARG NEXT_PUBLIC_API_URL=https://erp.nemmamnon.com/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN --mount=type=cache,target=/app/.next/cache npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
