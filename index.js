/* index.js: Node.js server for main/alt assignment on Fly.io */
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// This variable tracks if we've assigned the main client yet.
let mainAssigned = false;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Main/Alt WebSocket Server\n');
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// On each new connection:
wss.on('connection', (ws) => {
  console.log('[Server] A client connected. mainAssigned =', mainAssigned);

  if (!mainAssigned) {
    // This is the first client => main
    mainAssigned = true;
    ws.isMain = true;
    console.log('[Server] => Assigned this client as MAIN.');
    ws.send('role:main');
  } else {
    // Otherwise, alt
    ws.isMain = false;
    console.log('[Server] => Assigned this client as ALT.');
    ws.send('role:alt');
  }

  // When a client sends a message:
  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('[Server] Received:', msg);

    // Only the main can trigger a jump broadcast
    if (ws.isMain && msg === 'jump-button') {
      console.log('[Server] Main triggered jump => broadcasting to all');
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('jump');
        }
      });
    }
  });

  // When this client disconnects:
  ws.on('close', () => {
    console.log('[Server] A client disconnected. ws.isMain =', ws.isMain);
    if (ws.isMain) {
      // The main left => reset mainAssigned
      mainAssigned = false;
      console.log('[Server] The main client left. mainAssigned reset =', mainAssigned);
    }
  });
});

// Listen on 0.0.0.0 so Fly can route traffic
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT} (Fly.io)`);
});
