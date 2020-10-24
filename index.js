const open = require('opn');
const Server = require('./src/server');
const argv = require('./src/argv');

const server = new Server(process.cwd());
server.listen(argv.port, () => {
  console.info(`markdown preview server listening on ${argv.port}`);
  argv._.forEach((file) => {
    open(`http://localhost:${argv.port}/${file}`).then(() => {
      console.info(`${file} loaded.`);
    }).catch(() => {});
  });
});
