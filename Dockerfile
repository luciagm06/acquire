FROM node:18

WORKDIR /app

COPY acquire/package*.json ./

RUN npm install

COPY acquire/ ./

EXPOSE 3001

CMD ["node", "server.js"]