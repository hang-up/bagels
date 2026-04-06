FROM node:22-alpine AS development-stage

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 6384

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "6384"]
