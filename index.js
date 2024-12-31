/* index.js */
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
let mainAssigned = false;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Main/Alt WebSocket Server\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[Server] A client connected.');

  if (!mainAssigned) {
    mainAssigned = true;
    ws.isMain = true;
    console.log('[Server] Assigned this client as MAIN.');
    ws.send('role:main');
  } else {
    ws.isMain = false;
    console.log('[Server] Assigned this client as ALT.');
    ws.send('role:alt');
  }

  ws.on('message', (data) => {
    const msg = data.toString();
    console.log('[Server] Received:', msg);

    // When the main client sends "jump-button", broadcast "jump" to everyone
    if (ws.isMain && msg === 'jump-button') {
      console.log('[Server] Main triggered jump → broadcasting');
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('jump');
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('[Server] A client disconnected.');
    if (ws.isMain) {
      mainAssigned = false;
      console.log('[Server] The main client left. mainAssigned reset.');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
