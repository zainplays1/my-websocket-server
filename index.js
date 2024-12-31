const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

class AltController {
    constructor() {
        this.mainClient = null;
        this.altClients = new Map(); // Maps WebSocket clients to their alt numbers
        this.nextAltNumber = 1;
        this.disconnectedAltNumbers = []; // Track disconnected alt numbers for reuse
    }

    assignMain(ws) {
        this.mainClient = ws;
        ws.isMain = true;
        ws.send('role:main');
        console.log('[Server] Assigned new main client');
    }

    assignAlt(ws) {
        // Reuse disconnected alt numbers if available
        let altNumber;
        if (this.disconnectedAltNumbers.length > 0) {
            altNumber = this.disconnectedAltNumbers.shift();
        } else {
            altNumber = this.nextAltNumber++;
        }

        ws.isMain = false;
        ws.altNumber = altNumber;
        this.altClients.set(ws, altNumber);
        ws.send(`role:alt${altNumber}`);
        console.log(`[Server] Assigned client as ALT #${altNumber}`);
        
        // Log current state
        this.logState();
    }

    handleDisconnect(ws) {
        if (ws.isMain) {
            this.mainClient = null;
            console.log('[Server] Main client disconnected');
        } else {
            const altNumber = this.altClients.get(ws);
            if (altNumber) {
                // Store the disconnected alt number for reuse
                this.disconnectedAltNumbers.push(altNumber);
                // Sort to keep numbers ordered
                this.disconnectedAltNumbers.sort((a, b) => a - b);
                this.altClients.delete(ws);
                console.log(`[Server] Alt #${altNumber} disconnected`);
            }
        }
        
        // Log current state after disconnect
        this.logState();
    }

    broadcastCommand(command) {
        // Send command to all connected clients
        [...this.altClients.keys()].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(command);
            }
        });
    }

    logState() {
        console.log('\n=== Current Server State ===');
        console.log('Main Client:', this.mainClient ? 'Connected' : 'Not Connected');
        console.log('Connected Alts:', this.altClients.size);
        console.log('Available Alt Numbers:', [...this.disconnectedAltNumbers]);
        console.log('Next Alt Number:', this.nextAltNumber);
        console.log('========================\n');
    }
}

// Create server and controller
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alt Control WebSocket Server\n');
});

const wss = new WebSocket.Server({ server });
const controller = new AltController();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('[Server] New client connected');

    // Assign role based on current state
    if (!controller.mainClient) {
        controller.assignMain(ws);
    } else {
        controller.assignAlt(ws);
    }

    // Handle messages
    ws.on('message', (data) => {
        const msg = data.toString();
        console.log('[Server] Received:', msg);

        if (ws.isMain && msg.startsWith('command:')) {
            controller.broadcastCommand(msg);
        }
    });

    // Handle disconnections
    ws.on('close', () => {
        controller.handleDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('[Server] WebSocket error:', error);
        controller.handleDisconnect(ws);
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Closing server...');
    wss.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});
