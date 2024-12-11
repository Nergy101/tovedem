# This dockerfile is used to build the Docker image locally,
# and builds its own dist directory in the 1st base layer to copy the build files to the nginx image.
FROM node:22.3-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps //@TODO: Remove legacy-peer-deps when possible
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/tovedem-reserveringen/browser /usr/share/nginx/html
EXPOSE 80

# local:
# docker auth
# docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t nergy101/tovedem:latest --push .
# docker login
# docker push nergy101/tovedem:latest
# on VM:
# docker pull nergy101/tovedem:latest
# docker stop tovedem && docker rm tovedem
# docker run --restart unless-stopped -p 4001:80 -d --name tovedem nergy101/tovedem:latest
