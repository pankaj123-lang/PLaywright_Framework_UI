let logFn = console.log; // default to console.log if not overridden

function setLogger(fn) {
  logFn = fn;
}

function getLogger() {
  return logFn;
}

module.exports = {
  setLogger,
  getLogger,
};
