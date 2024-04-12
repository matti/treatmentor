FROM node:20.12.1

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm install

COPY . .
ENTRYPOINT [ "/app/docker-entrypoint.sh" ]
