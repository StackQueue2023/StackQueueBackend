// Serverless Global Environment Polyfills for Node.js / AWS Lambda / Vercel
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
    }
  };
}
if (typeof global.DOMPoint === 'undefined') {
  global.DOMPoint = class DOMPoint {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
  };
}
if (typeof global.DOMRect === 'undefined') {
  global.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x; this.y = y; this.width = width; this.height = height;
      this.top = y; this.right = x + width; this.bottom = y + height; this.left = x;
    }
  };
}

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
