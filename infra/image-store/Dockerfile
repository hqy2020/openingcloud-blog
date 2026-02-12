FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN addgroup -S imgstore && adduser -S imgstore -G imgstore
RUN mkdir -p /var/lib/imgstore && chown imgstore:imgstore /var/lib/imgstore

USER imgstore

EXPOSE 8080

CMD ["node", "src/server.mjs"]
