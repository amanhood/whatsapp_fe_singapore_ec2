# Use Node.js 23 image
FROM node:23

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
RUN ls -la ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (commonly 5173 for Vite or 8080 for Vue CLI)
EXPOSE 5173

# Command to run the application
CMD ["npm", "run", "dev"]