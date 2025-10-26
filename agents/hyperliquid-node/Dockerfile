FROM node:20-alpine as base
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm ci || npm install
COPY tsconfig.json .
COPY src ./src
RUN npx tsc -p .
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
RUN addgroup -g 1001 -S nodejs && adduser -S agent -u 1001 -G nodejs
USER agent
EXPOSE 8000
CMD ["node","dist/index.js"]
