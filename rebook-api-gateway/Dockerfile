# Use a lightweight Node.js image
FROM node:22-alpine

# Set the environment to production
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Create a non-root user for enterprise-grade security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies (skips devDependencies)
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Switch to the secure non-root user
USER appuser

# Expose the port (Render will dynamically assign one, but this is good practice)
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]