FROM node:18

# Create app directory
WORKDIR /usr/src/observer

# Copy package files
COPY package*.json ./

# Install packages
RUN npm install

# Bundle app source
COPY . .

EXPOSE 4000

EXPOSE 8090

# Run the app
CMD ["./pocketbase", "serve", "&", "node", "run" ]