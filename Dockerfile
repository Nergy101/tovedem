### STAGE 1: Build ###
FROM node:22-alpine AS build
WORKDIR /usr/src/app

# Only copy package files first to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy build output only
COPY --from=build /usr/src/app/dist/tovedem/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Usage notes:
# docker build -t tovedem:latest .
# docker run -p 4200:4200 tovedem:latest

### tag as ...:tovedem:latest
### push to docker hub

# docker build -t tovedem:latest .
# docker tag tovedem:latest nergy101/tovedem:latest
# docker push nergy101/tovedem:latest
