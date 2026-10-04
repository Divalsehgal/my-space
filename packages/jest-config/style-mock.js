// CSS Modules stand-in: `styles.button` → "button", so class assertions stay readable.
module.exports = new Proxy({}, { get: (_target, key) => (key === '__esModule' ? false : key) });
