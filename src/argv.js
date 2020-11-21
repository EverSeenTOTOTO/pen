const DEFAULT_PORT = 6060;

module.exports = require('yargs')
  .usage('Usage: $0 [options] [file]')
  .option('p', {
    alias: 'port',
    default: DEFAULT_PORT,
    describe: 'Set a custom port',
  })
  .help('h')
  .alias('h', 'help').argv;
