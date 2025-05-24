# Use official Node.js image
FROM node:18-bullseye

# Install ffmpeg and clean up apt cache to reduce image size
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy all app source code
COPY . .

# Expose port (adjust if needed)
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]
