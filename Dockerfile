# =========================================
# Stage 1: Build the React (Vite) Application
# =========================================
 
ARG NODE_VERSION=24.14.0-alpine
# Use a lightweight Node.js image for building (customizable via ARG)
FROM node:${NODE_VERSION} AS builder
 
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Set the working directory inside the container
WORKDIR /app
 
 
# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json ./
 
 
# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm HUSKY=0 npm ci
 
 
# Copy the rest of the application source code into the container
COPY . .
 
# Build the React.js application (outputs to /app/dist)
RUN npm run build

FROM nginx:stable-alpine

ENV BACKEND_HOST=host.docker.internal
ENV BACKEND_PORT=8080

COPY ./nginx/nginx.docker.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
