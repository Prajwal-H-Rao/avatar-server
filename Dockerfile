# Use official Node.js 20 Alpine image for smaller size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

RUN npm i
# Install dependencies (use npm ci for exact versions)

# Copy application source code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Create a non-root user and switch to it
RUN adduser -D appuser
USER appuser

# Start the application
CMD ["npm", "start"]