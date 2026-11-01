# Stage 1: Build the React application
FROM node:24-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Configure the backend API address
ARG VITE_API_BASE_URL=http://127.0.0.1:8001/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build React for production
RUN npm run build


# Stage 2: Serve React using Nginx
FROM nginx:stable-alpine

# Copy the production build into Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]