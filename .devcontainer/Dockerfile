
# Use a Node.js base image (needs 18 for fetch)
FROM node:18

# Install zsh
RUN apt-get update && apt-get install -y zsh

# Set zsh as the default shell for the "node" user
RUN chsh -s /usr/bin/zsh node

# Install pnpm globally
RUN npm install -g pnpm

# Set up default working directory
WORKDIR /workspace

# Expose a default port (useful for serving apps)
EXPOSE 4208 4200 5173 4000
