FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
# HTB: node binary accessible for sudo privesc
RUN which node
EXPOSE 8000
CMD ["node", "src/server.js"]
