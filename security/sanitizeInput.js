const xss = require('xss');

const myXssFilter = new xss.FilterXSS({
  stripIgnoreTag: true, // Remove all tags that aren't in the whitelist
  stripIgnoreTagBody: ['script'], // Remove the content inside 'script' tags
  a: ['href', 'title'], // Allow 'a' tags with 'href' and 'title' attributes
  b: [], // Allow 'b' tags without any attributes
  i: [], // Allow 'i' tags without any attributes
  br: [], // Allow 'br' tags without any attributes
  p: [] // Allow 'p' tags without any attributes
});

const sanitizeBodyWithWhitelist = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = myXssFilter.process(req.body[key]);
      }
    }
  }
  next();
};

module.exports = sanitizeBodyWithWhitelist;
