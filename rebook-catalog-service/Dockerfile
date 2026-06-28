# Use the stable Node 20 image (Debian-based)
FROM node:20

# Set the environment to production
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code and give ownership to the built-in 'node' user
COPY --chown=node:node . .

# Switch to the secure non-root user (built into the node image)
USER node

# Expose the port (Render will dynamically assign one, but this is good practice)
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]