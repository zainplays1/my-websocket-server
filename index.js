/* index.js */
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
let mainAssigned = false;
let altCount = 0;

const server = http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("Main/Alt WebSocket Server\n");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("[Server] A client connected.");

  // Assign role
  if (!mainAssigned) {
    mainAssigned = true;
    ws.isMain = true;
    console.log("[Server] Assigned this client as MAIN.");
    ws.send("role:main");
  } else {
    altCount++;
    ws.isMain = false;
    ws.altNumber = altCount;
    console.log(`[Server] Assigned this client as ALT #${altCount}`);
    ws.send(`role:alt${altCount}`);
  }

  ws.on("message", (data) => {
    // If main sends e.g. "command: {...}"
    if (ws.isMain && data.toString().startsWith("command:")) {
      // Broadcast to all
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("[Server] A client disconnected.");
    if (ws.isMain) {
      mainAssigned = false;
      console.log("[Server] The main client left. mainAssigned reset.");
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
});
