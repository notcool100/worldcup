FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_ vars are embedded at build time — must be a build arg
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Only copy what's needed to run
COPY --from=build /app/public        ./public
COPY --from=build /app/.next         ./.next
COPY --from=build /app/node_modules  ./node_modules
COPY --from=build /app/package.json  ./package.json
EXPOSE 3000
CMD ["npm", "start"]
