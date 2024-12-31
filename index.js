/* index.js - Node.js server with commands + settings */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// Track the main
let mainAssigned = false;

// Count how many alts joined (for alt1, alt2, alt3, etc.)
let altCount = 0;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Main & Alts WebSocket Server with Commands\n');
});

const wss = new WebSocket.Server({ server });

// On each new client connection:
wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');

  // Assign role
  if (!mainAssigned) {
    // This is the main
    mainAssigned = true;
    ws.isMain = true;
    console.log('[Server] Assigned this client as MAIN.');
    ws.send('role:main'); // The client script sees "role:main"
  } else {
    // This is an alt
    altCount++;
    ws.isMain = false;
    ws.altNumber = altCount;
    console.log(`[Server] Assigned this client as ALT #${altCount}`);
    ws.send(`role:alt${altCount}`);
  }

  // When a client sends a message (commands, etc.)
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('[Server] Received:', msg);

    // If main is sending a command like "command: line" or "command: chat:..."
    if (ws.isMain && msg.startsWith('command:')) {
      // Broadcast the command to everyone (including main, though main can ignore or handle it differently if desired)
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  });

  // If client disconnects
  ws.on('close', () => {
    console.log('[Server] A client disconnected.');
    if (ws.isMain) {
      mainAssigned = false;
      console.log('[Server] The main client left. Resetting mainAssigned.');
    }
    // We do NOT reset altCount, so new alts keep incrementing (alt1, alt2, alt3,...).
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT} (Fly.io / 0.0.0.0)`);
});
