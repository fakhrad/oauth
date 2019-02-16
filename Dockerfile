FROM node:alpine AS authservice

WORKDIR /app
COPY . /app 
RUN npm install



