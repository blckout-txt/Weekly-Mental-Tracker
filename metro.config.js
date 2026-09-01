const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite runs on the web through wa-sqlite, which ships as a .wasm binary.
// Metro needs to treat it as an asset for the web bundle to resolve.
config.resolver.assetExts.push('wasm');

// wa-sqlite's worker needs SharedArrayBuffer, which browsers only expose to
// cross-origin-isolated pages. The dev server has to send these headers, and
// whatever hosts the production build has to send them too.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return middleware(req, res, next);
  },
};

module.exports = config;
