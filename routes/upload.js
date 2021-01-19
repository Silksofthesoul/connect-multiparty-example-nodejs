const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const {
  parse,
  join
} = path;

const {
  exists
} = fs;

const {
  readFile,
  writeFile,
  appendFile,
  unlink,
  copyFile
} = fsp;

const s = ob => JSON.stringify(ob);
const p = st => JSON.parse(st);
const co = ob => p(s(ob));
const int = x => parseInt(x);

const asyncExist = (pathToFile) => new Promise(resolve => {
  exists(pathToFile, isExist => resolve(isExist));
});

const filelog = async ({
  logFolder,
  sessionKeyId,
  chunkNumber,
  totalChunks,
  originalFilename,
  tmpPath,
  newFilePath
}) => {
  const extensionLogFile = 'log';
  const {base: sessionFileName =  null} = parse(tmpPath);
  const pathToLogFile = join(
    logFolder,
    `${sessionKeyId}-${originalFilename}.${extensionLogFile}`
  );
  const chunk = `${s([chunkNumber, tmpPath])}\n`;
  await appendFile(pathToLogFile, chunk);
  return pathToLogFile;
};

const copy = async ({chunks, newFilePath}) => {
  console.log('start copy');
  const isExist = await asyncExist(newFilePath);
  if (isExist) await unlink(newFilePath);
  for (let [number, tmpPath] of chunks) {
    if(int(number) === 1) {
      await copyFile(tmpPath, newFilePath);
    } else {
      const tmpContent = await readFile(tmpPath);
      await appendFile(newFilePath, tmpContent);
    }
  }
  return 'done';
}

const clean = async ({pathToLogFile, chunks}) => {
  console.log('start clean');
  for (let [number, tmpPath] of chunks) {
    console.log('delete:', tmpPath);
    await unlink(tmpPath);
  }
  await unlink(pathToLogFile);
}

const demonKiller = ({time, pathToFile}) => {
  setTimeout(async _ => {
    console.log('time to kill:', pathToFile);
    const isExist = await asyncExist(pathToFile);
    if(isExist) await unlink(pathToFile);
  }, time);
};

const route = async (app, ctx) => {

  const {
    multipartMiddleware,
    uploadPath,
    uploadTmpPath
  } = ctx;

  app.post('/upload', multipartMiddleware, async (req, res, next) => {
    // !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!
    // !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!
    // Example for npm package 'vue-simple-uploader'
    // https://github.com/simple-uploader/vue-uploader
    // https://www.npmjs.com/package/vue-simple-uploader
    // https://vuejsexamples.com/a-vue-js-upload-component-powered-by-simple-uploader-js/
    // !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!
    // !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!  !!!!!!!!!!!!
    const {body, headers} = req;
    const {files} = req;
    const {
      file: {
        originalFilename,
        path: tmpPath = null
      }
    } = files;

    const { chunkNumber, totalChunks, sessionKeyId } = body;

    const newFilePath = join(uploadPath, originalFilename);


    const pathToLogFile = await filelog({
      logFolder: uploadTmpPath,
      sessionKeyId,
      chunkNumber,
      totalChunks,
      originalFilename,
      tmpPath,
      newFilePath
    });

    const timeToLiveChunk = 5000;
    const timeToLiveAllChunks = totalChunks * timeToLiveChunk;

    demonKiller({
      pathToFile: tmpPath,
      time: timeToLiveAllChunks
    });

    demonKiller({
      pathToFile: pathToLogFile,
      time: timeToLiveAllChunks
    });

    res.send('ok'); // send 'ok 200' for client

    const _chunks = await readFile(pathToLogFile);
    const chunks = Object.entries(_chunks
    .toString()
    .split('\n')
    .filter(item => item !== '' && item !== null && item !== undefined )
    .map(item => p(item))
    .reduce((acm, curr) => ({...acm, [curr[0]]: curr[1]}), {}))
    .map(([num, str]) => ([int(num), str]))
    .sort((a, b) => int(a[0]) > int(b[0]) ? 1 : int(a[0]) < int(b[0]) ? -1: 0);

    if(int(chunks.length) === int(totalChunks)) {
      await copy({chunks, newFilePath});
      await clean({pathToLogFile, chunks});
    }
  });
};

module.exports = route;
