// server.js
const WebSocket = require('ws');
const PORT = 8080; // or process.env.PORT if hosting on a service like Fly.io

// Create a WebSocket Server
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

wss.on('connection', (ws) => {
  console.log('[Server] A client connected!');

  ws.on('message', (msg) => {
    console.log('[Server] Received from client:', msg.toString());
    // When the client clicks the button, it sends a message here.

    // 50/50 chance
    const random = Math.random(); // 0 to 1
    if (random < 0.5) {
      // Send "jump" instruction
      ws.send('jump');
    } else {
      // Send "nojump" instruction
      ws.send('nojump');
    }
  });

  ws.on('close', () => {
    console.log('[Server] A client disconnected.');
  });
});
