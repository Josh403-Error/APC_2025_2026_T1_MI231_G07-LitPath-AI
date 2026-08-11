FROM node:21-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
# Set the API base URL to a relative path during build
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Install ALL dependencies, including dev dependencies needed for the build (like vite)
RUN npm ci

# Copy source code
COPY . .

# Build the production-ready app with the relative API URL, explicitly passing the env var to the build command
RUN VITE_API_BASE_URL=/api npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to handle routing for SPA and proxy API
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]