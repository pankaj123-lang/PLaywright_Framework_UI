// backend/sseLog.js
const { logEmitter } = require("./logEmitter.js");

const clients = [];

function addClient(res, req) {
  clients.push(res);

  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
}

// Broadcast logs to all SSE clients
logEmitter.on("log", (log) => {
  for (const client of clients) {
    client.write(`data: ${log}\n\n`);
  }
});

module.exports = { addClient };
