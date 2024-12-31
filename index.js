// index.js (Node.js)
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// Create an HTTP server so Fly sees a health-check response
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket multi-client jump server\n');
});

// Attach a WebSocket.Server to the HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');

  ws.on('message', (data) => {
    console.log('[Server] Received message:', data.toString());

    // If the message is "jump-button", broadcast "jump" to ALL clients
    if (data.toString() === 'jump-button') {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('jump'); 
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('[Server] A client disconnected.');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
