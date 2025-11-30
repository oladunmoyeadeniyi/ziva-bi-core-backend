---

# ✅ *FILE 6 → backend/Dockerfile*

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["npm", "run", "start"]