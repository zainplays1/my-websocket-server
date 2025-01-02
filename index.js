const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Track connections and roles
const connections = new Map(); // ws -> {role: 'main'|'alt', number: null|number}
let nextAltNumber = 1;
let availableNumbers = []; // Store numbers from disconnected alts

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alt Control WebSocket Server\n');
});

const wss = new WebSocket.Server({ server });

function getMainClient() {
    for (let [client, info] of connections.entries()) {
        if (info.role === 'main') return client;
    }
    return null;
}

wss.on('connection', (ws) => {
    console.log('[Server] New client connected');

    // Assign role
    const mainExists = getMainClient();
    if (!mainExists) {
        connections.set(ws, { role: 'main', number: null });
        ws.send('role:main');
        console.log('[Server] Assigned as MAIN');
    } else {
        // Assign the lowest available alt number
        let altNumber;
        if (availableNumbers.length > 0) {
            altNumber = Math.min(...availableNumbers);
            availableNumbers = availableNumbers.filter(n => n !== altNumber);
        } else {
            altNumber = nextAltNumber++;
        }
        connections.set(ws, { role: 'alt', number: altNumber });
        ws.send(`role:alt${altNumber}`);
        console.log(`[Server] Assigned as ALT #${altNumber}`);
    }

    // Log current state
    console.log('\n=== Current Connections ===');
    for (let [client, info] of connections.entries()) {
        console.log(`Client: ${info.role}${info.number ? ' #' + info.number : ''}`);
    }
    console.log('=========================\n');

    ws.on('message', (data) => {
        const msg = data.toString();
        console.log('[Server] Received:', msg);

        // Handle commands from main
        if (connections.get(ws).role === 'main' && msg.startsWith('command:')) {
            // Broadcast to all alts
            for (let [client, info] of connections.entries()) {
                if (info.role === 'alt' && client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            }
        }
    });

    ws.on('close', () => {
        const info = connections.get(ws);
        if (info) {
            console.log(`[Server] Client disconnected: ${info.role}${info.number ? ' #' + info.number : ''}`);
            
            // If it was an alt, make its number available again
            if (info.role === 'alt') {
                availableNumbers.push(info.number);
                availableNumbers.sort((a, b) => a - b);
            }
            
            // Remove from connections
            connections.delete(ws);
            
            // Log the new state
            console.log('\n=== Current Connections ===');
            for (let [client, info] of connections.entries()) {
                console.log(`Client: ${info.role}${info.number ? ' #' + info.number : ''}`);
            }
            console.log('Available numbers:', availableNumbers);
            console.log('=========================\n');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on port ${PORT}`);
});
