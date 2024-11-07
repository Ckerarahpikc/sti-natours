// securityMiddleware.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  // controls sources for scripts, styles, etc.
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': [
        "'self'",
        'https://*.mapbox.com',
        'https://js.stripe.com/v3/'
      ], // default
      'script-src': [
        "'self'",
        'trusted-cdn.com',
        'https://*.mapbox.com',
        'https://js.stripe.com/v3/'
      ], // trusted scripts
      'style-src': [
        "'self'",
        'https://fonts.googleapis.com',
        'https://*.mapbox.com'
      ], // allow styles for
      'worker-src': ["'self'", 'blob:'], // required blob for workers
      'connect-src': [
        "'self'",
        'https://*.mapbox.com',
        'http://127.0.0.1:3000',
        'ws://localhost:*'
      ] // localhost for devs and mapbox for production
    }
  },

  // prevents clickjacking by disallowing iframes
  frameguard: {
    action: 'deny'
  },

  // enforce to use https instead of http to prevent attacks like man-in-the-middle
  hsts: {
    maxAge: 31_536_000_000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },

  // controls how much referrer info (URI) should be included with request made from our site
  referrerPolicy: {
    policy: 'no-referrer'
  },

  // basic xss filter
  xssFilter: true,

  // hide "X-Powered-By" header
  hidePoweredBy: true,

  // disable DNS prefetching
  dnsPrefetchControl: { allow: false },

  // prevent browsers to user files as a different MIME type than what is specified
  noSniff: true,

  //prevent IE from opening files in its own context
  ieNoOpen: true
});

module.exports = securityMiddleware;
