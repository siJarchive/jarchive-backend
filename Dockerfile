# Menggunakan Node.js versi 20 (LTS) basis Debian Bookworm
FROM node:20-bookworm

# Set working directory
WORKDIR /app

# Copy package files & Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy seluruh source code
COPY . .

# Expose port aplikasi
EXPOSE 5000

# Jalankan server dalam mode production
CMD ["node", "server.js"]