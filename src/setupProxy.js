const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'https://final-natiq-back.vercel.app',
            changeOrigin: true,
        })
    );
    app.use(
        '/socket.io',
        createProxyMiddleware({
            target: 'https://final-natiq-back.vercel.app',
            changeOrigin: true,
            ws: true,
        })
    );
};
