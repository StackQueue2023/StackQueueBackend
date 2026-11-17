let app = null;
let bootError = null;

try {
  app = require('../server');
} catch (err) {
  bootError = err;
  console.error('[CRITICAL BOOT ERROR In api/index.js]:', err);
}

module.exports = (req, res) => {
  if (bootError) {
    console.error('[Vercel Invocation Failed Due To Boot Error]:', bootError);
    return res.status(500).json({
      success: false,
      error: 'Vercel Serverless Boot Error',
      message: bootError.message,
      stack: bootError.stack
    });
  }
  return app(req, res);
};
