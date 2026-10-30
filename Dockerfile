FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
