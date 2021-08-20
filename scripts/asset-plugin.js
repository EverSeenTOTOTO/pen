const path = require('path');
const fs = require('fs');

module.exports = class AssetPlugin {
  constructor() {
    this.name = 'my-asset-plugin';
  }

  apply(compiler) {
    const logger = compiler.getInfrastructureLogger(this.name);
    compiler.hooks.done.tapAsync(this.name, (stats, callback) => {
      const { outputPath } = compiler;
      const assets = Object.keys(stats.compilation.assets);

      logger.info(assets);
      fs.writeFileSync(
        path.resolve(outputPath, 'assets.json'),
        JSON.stringify(assets, null, 2),
      );
      callback(null, stats);
    });
  }
};
