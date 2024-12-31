// index.js (Node on Fly.io)
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
let mainAssigned = false; // Tracks if we've assigned the main client yet

// Simple HTTP response for Fly.io health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Main & Alts WebSocket Server\n');
});

const wss = new WebSocket.Server({ server });

// On each new WebSocket connection
wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');

  // If no main is assigned, this client becomes main
  if (!mainAssigned) {
    mainAssigned = true;
    ws.isMain = true;
    console.log('[Server] Assigned this client as MAIN.');
    ws.send('role:main');
  } else {
    // Otherwise, it's an alt
    ws.isMain = false;
    console.log('[Server] Assigned this client as ALT.');
    ws.send('role:alt');
  }

  // When we receive a message
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('[Server] Received:', msg);

    // Only the main can broadcast "jump"
    if (ws.isMain && msg === 'jump-button') {
      console.log('[Server] Main triggered jump → broadcasting');
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('jump');
        }
      });
    }
  });

  // If this client disconnects
  ws.on('close', () => {
    console.log('[Server] A client disconnected.');

    // If the main leaves, clear the "main" so a new connection can become main
    if (ws.isMain) {
      mainAssigned = false;
      console.log('[Server] The main client left. No main is assigned now.');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
