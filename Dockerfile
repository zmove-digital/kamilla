# AURELLE store - zero dependency Node image
FROM node:24-alpine

WORKDIR /app

# No npm install needed - the app uses only Node built-ins.
COPY package.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=3000
# Mount a volume at /app/data so the SQLite database survives restarts.
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "src/server.js"]
