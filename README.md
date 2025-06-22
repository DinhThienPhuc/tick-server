# Tick Server

A high-performance Server-Sent Events (SSE) service built with Express.js and TypeScript that broadcasts events every minute to all connected clients.

## Features

- 🕐 **Precise Timing**: Events are sent exactly on the minute (e.g., 13:01:00, 14:47:00)
- 🔄 **Real-time Streaming**: Uses Server-Sent Events for efficient real-time communication
- 🛡️ **Production Ready**: Includes security headers, error handling, and graceful shutdown
- 📊 **Monitoring**: Built-in health checks and statistics endpoints
- 🚀 **High Performance**: Optimized for handling multiple concurrent connections
- 🔒 **TypeScript**: Fully typed for better development experience

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.example .env

# Start development server
pnpm dev
```

### Production

```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Core Endpoints

- `GET /` - API information and available endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/stats` - Server statistics (client count, uptime)
- `GET /api/events` - Server-Sent Events stream

### Development Only

- `POST /api/test-tick` - Manually trigger a tick event (development only)

## Usage Examples

### JavaScript/TypeScript Client

```javascript
// Connect to the SSE stream
const eventSource = new EventSource("http://localhost:3000/api/events");

// Listen for tick events
eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received tick:", data);

  // Example response:
  // {
  //   timestamp: "2024-01-15T13:01:00.123Z",
  //   minute: 1,
  //   hour: 13,
  //   date: "Mon Jan 15 2024",
  //   message: "Tick at 13:01:00"
  // }
};

// Handle connection events
eventSource.onopen = function () {
  console.log("Connected to tick server");
};

eventSource.onerror = function (error) {
  console.error("SSE error:", error);
};

// Clean up when done
// eventSource.close();
```

### HTML Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Tick Server Client</title>
  </head>
  <body>
    <h1>Tick Server Events</h1>
    <div id="events"></div>

    <script>
      const eventsDiv = document.getElementById("events");
      const eventSource = new EventSource("http://localhost:3000/api/events");

      eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const eventElement = document.createElement("div");
        eventElement.innerHTML = `
        <strong>${data.timestamp}</strong>: ${data.message}
      `;
        eventsDiv.appendChild(eventElement);
      };
    </script>
  </body>
</html>
```

### cURL Testing

```bash
# Test SSE connection
curl -N -H "Accept: text/event-stream" http://localhost:3000/api/events

# Check server health
curl http://localhost:3000/api/health

# Get statistics
curl http://localhost:3000/api/stats
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Available Log Levels

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (default)
- `debug` - All logs including debug information

## Architecture

### Key Components

1. **TickService**: Core service managing SSE clients and timing
2. **Express App**: HTTP server with security middleware
3. **Error Handling**: Comprehensive error handling and logging
4. **Graceful Shutdown**: Clean shutdown with connection cleanup

### Timing Implementation

The server calculates the exact milliseconds until the next minute and uses a combination of `setTimeout` and `setInterval` to ensure precise timing:

1. Initial `setTimeout` to sync with the next minute
2. `setInterval` every 60 seconds for subsequent ticks

## Development

### Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix      # Fix ESLint issues
pnpm type-check   # Run TypeScript type checking
```

### Project Structure

```
src/
├── index.ts              # Main entry point
├── app.ts                # Express application setup
├── types/                # TypeScript type definitions
│   └── index.ts
├── utils/                # Utility functions
│   ├── config.ts          # Environment configuration
│   └── logger.ts         # Winston logger setup
├── services/             # Business logic services
│   └── TickService.ts    # Core SSE service
├── middleware/           # Express middleware
│   └── errorHandler.ts   # Error handling middleware
└── routes/               # API routes
    └── index.ts          # Route definitions
```

## Monitoring

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T13:01:00.123Z",
  "uptime": 3600
}
```

### Statistics Response

```json
{
  "status": "ok",
  "data": {
    "clientCount": 5,
    "uptime": "3600"
  },
  "timestamp": "2024-01-15T13:01:00.123Z"
}
```

## Production Deployment

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Process Management

The server includes proper signal handling for graceful shutdown:

- `SIGTERM` and `SIGINT` trigger graceful shutdown
- All SSE connections are properly closed
- 10-second timeout for forced shutdown

## License

ISC
