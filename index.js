const http = require('http');
const WebSocket = require('ws');

// Use port from Fly, or default to 3000 if not set
const PORT = process.env.PORT || 3000;

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Fly.io WebSocket server is running!\n');
});

// Attach WebSocket.Server to the same HTTP server
const wss = new WebSocket.Server({ server });

// On WebSocket connection
wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');
  ws.on('message', (msg) => {
    console.log('[Server] Received:', msg.toString());
    // Example 50/50 logic
    if (Math.random() < 0.5) {
      ws.send('jump');
    } else {
      ws.send('nojump');
    }
  });
});

// Listen on 0.0.0.0:PORT
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
