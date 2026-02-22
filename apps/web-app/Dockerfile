FROM node:20-alpine AS deps
WORKDIR /app
# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy web-app package.json
COPY apps/web-app/package.json ./apps/web-app/
# Copy workspace packages
COPY packages ./packages
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/web-app ./apps/web-app
WORKDIR /app/apps/web-app
RUN NEXT_OUTPUT=standalone npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web-app/.next/standalone ./
COPY --from=builder /app/apps/web-app/.next/static ./.next/static
COPY --from=builder /app/apps/web-app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
