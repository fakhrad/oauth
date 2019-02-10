FROM node:alpine AS oauth

WORKDIR /app
COPY . /app 
RUN npm install



