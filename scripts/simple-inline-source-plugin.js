/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createHtmlTagObject } = require('html-webpack-plugin/lib/html-tags');

// 将输出的stlye和script内联到html中去，由于html-webpack-inline-source-plugin太久没有维护，
// 已经不支持比较新的webpack和html-webpack-plugin
module.exports = class SimpleInlineSourcePlugin {
  compilation = null;

  apply(compiler) {
    compiler.hooks.compilation.tap('SimpleInlineSourcePlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
        'SimpleInlineSourcePlugin',
        (data, cb) => {
          // Manipulate the content
          this.compilation = compilation;
          const newData = this.process(data);
          // Tell webpack to move on
          cb(null, newData);
        },
      );
    });
  }

  process(data) {
    const assetTags = {
      ...data.assetTags,
      scripts: this.processScript(data.assetTags.scripts),
      styles: this.processStyle(data.assetTags.styles),
    };
    return {
      ...data,
      assetTags,
    };
  }

  processScript(scriptTags) {
    return scriptTags.map((tag) => {
      const filepath = tag.attributes.src;
      const attributes = {
        ...tag.attributes,
        type: 'text/javascript',
      };
      delete attributes.src;
      const newTag = createHtmlTagObject('script', attributes);
      return this.processTag(newTag, filepath);
    });
  }

  processStyle(styleTags) {
    return styleTags.map((tag) => {
      const filepath = tag.attributes.href;
      const attributes = {
        ...tag.attributes,
        type: 'text/css',
      };
      delete attributes.href;
      const newTag = createHtmlTagObject('style', attributes);
      return this.processTag(newTag, filepath);
    });
  }

  processTag(tag, filepath) {
    const asset = this.compilation.assets[filepath];
    if (asset) {
      // eslint-disable-next-line no-param-reassign
      tag.innerHTML = asset.source(); // suppose not using source-map
    }
    return tag;
  }
};
