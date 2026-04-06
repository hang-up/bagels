FROM node:22-alpine AS development-stage

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src
COPY data ./data

EXPOSE 4200

CMD ["npm", "run", "dev"]
