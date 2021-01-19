const options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html', 'mp3', 'ogg', 'wav', 'js', 'txt'],
  index: false,
  maxAge: 1,
  redirect: false,
  setHeaders(res) {
    res.set('x-timestamp', Date.now());
  },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
};

const port = 3000;

module.exports = {
  port,
  options,
  headers,
  isMinify,
  isCompileStatic,
};
