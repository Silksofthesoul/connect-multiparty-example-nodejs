// std
const path = require('path');
const fsp = require('fs').promises;

// dependences
const express = require('express');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const fs = require('fs-extra');

// app
const routes = require('./routes');
const settings = require('./settings');

require('dotenv').config();

const { port, headers, options } = settings;

const app = express();

const uploadPath = path.join(__dirname, 'files');
const uploadTmpPath = path.join(uploadPath, 'tmp');

const createAndCleanFolders = async _ => {
  fs.ensureDir(uploadPath);
  fs.emptyDirSync(uploadTmpPath)
  fs.ensureDir(uploadTmpPath);
};
createAndCleanFolders();

const multipartMiddleware = multipart({
  uploadDir: uploadTmpPath,
});

app.set('env', process.env.NODE_ENV);

app.use((req, res, next) => {
  Object.entries(headers)
  .forEach(([key, value], i) => res.header(key, value));
  next();
}).options('*', (req, res) => res.end());

app.use(express.static('static', options));

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({
  limit: '5mb',
  extended: true,
  parameterLimit: 5000,
}));


const param = {
  upload: {
    uploadPath,
    uploadTmpPath,
    multipartMiddleware
  }
};

const middle = function (req, res, next) {
  console.log('--------- -----------');
  console.log(`${req.method}: ${req.url}\n`);
  next();
};

app.use(middle);

const runRouters = async _ =>  {
  for (let [key, router] of Object.entries(routes)) {
    await router(app, param[key] ? param[key] : {});
  }
};

runRouters();

app.listen(port, (err) => {
  if (err) {
    return console.error('error: ', err);
    throw new Error(err);
  }
  console.log(`\n\n`);
  console.log('process.env.NODE_ENV:\t ', process.env.NODE_ENV);
  console.log('env:\t\t\t ', app.get('env'));
  console.log(`Server runing on http://localhost:${port}/ ${new Date()}`);
  console.log(`\n\n`);
});
