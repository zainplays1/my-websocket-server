/* index.js: Node.js server for main/alt assignment */

const http = require('http');
const WebSocket = require('ws');

// Fly.io typically sets PORT to 3000. If not, default to 3000 locally.
const PORT = process.env.PORT || 3000;

// Track if we've assigned the main client yet
let mainAssigned = false;

const server = http.createServer((req, res) => {
  // Basic HTTP response for Fly's health check or browser visits
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Main/Alt WebSocket Server\n');
});

// Create a WebSocket server on top of the HTTP server
const wss = new WebSocket.Server({ server });

// On each new WebSocket connection
wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');

  // Assign this client as main if none assigned yet
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

  // When we receive a message from this client
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('[Server] Received:', msg);

    // Only the main can broadcast a "jump"
    if (ws.isMain && msg === 'jump-button') {
      console.log('[Server] Main triggered jump → broadcasting');
      // Send "jump" to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('jump');
        }
      });
    }
  });

  // If the client disconnects
  ws.on('close', () => {
    console.log('[Server] A client disconnected.');
    // If it was main, clear the main so next new client becomes main
    if (ws.isMain) {
      mainAssigned = false;
      console.log('[Server] The main client left. mainAssigned reset.');
    }
  });
});

// Finally, listen on 0.0.0.0 (all interfaces) so Fly can route traffic
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
