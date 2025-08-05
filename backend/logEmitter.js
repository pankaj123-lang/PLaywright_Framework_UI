// backend/logEmitter.js
const { EventEmitter } = require("events");
const logEmitter = new EventEmitter();

module.exports = { logEmitter };
