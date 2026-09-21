# AED-SNN Full-Stack Docker Container
# Builds C++ simulation engine & runs Node.js API Bridge + WebSocket stream
FROM node:20-bookworm

# Install C++ compiler & CMake
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project source
COPY . .

# Build C++ Simulation Engine
RUN mkdir -p build && \
    cd build && \
    cmake .. && \
    cmake --build . --config Release

# Build Frontend static bundle
RUN cd frontend && \
    npm install && \
    npm run build

# Install Backend dependencies
RUN cd backend && \
    npm install

# Expose backend API and WebSocket port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start Node.js API Bridge
CMD ["node", "backend/server.js"]
