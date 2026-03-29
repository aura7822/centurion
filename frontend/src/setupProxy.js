const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only proxy API routes and health — not static files
  app.use(
    ['/api', '/health'],
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.warn('[Proxy] Backend not reachable:', err.message);
        res.status(503).json({ error: 'Backend offline' });
      },
    })
  );
};
