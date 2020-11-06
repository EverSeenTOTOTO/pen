const fs = require('fs');
const { resolve } = require('path');
const nodeWatch = require('node-watch');
const convert = require('./markdown');

const MarkdownFilePattern = /^[^.].*.md$/;
const isDir = (filepath) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};
const readMarkdownFiles = (path) => {
  if (isDir(path)) {
    return fs.promises.readdir(path).then((files) => files.map((filename) => {
      if (MarkdownFilePattern.test(filename)) {
        return {
          filename,
          type: 'markdown',
        };
      } if (isDir(resolve(path, filename))) {
        return {
          filename: `${filename}/`,
          type: 'dir',
        };
      }
      return {
        type: 'other',
      };
    }).filter(({ type }) => type !== 'other'));
  }
  return convert(fs.readFileSync(path).toString());
};

/* eslint-disable class-methods-use-this */
module.exports = class Watcher {
  constructor(p) {
    this.path = p;
    this.watchObj = null;
    this.ondata = null;
    this.onerror = null;
  }

  start() {
    try {
      const watchObj = nodeWatch(this.path, {
        recursive: false,
        filter: MarkdownFilePattern,
      });
      watchObj.on('change', this.trigger.bind(this));
      watchObj.on('error', this.onerror);// 不需要bind因为是传入的闭包
      this.watchObj = watchObj;
    } catch (e) {
      this.onerror(e);
    }
  }

  stop() {
    if (this.watchObj) {
      this.watchObj.close();
    }
  }

  trigger() {
    try {
      readMarkdownFiles(this.path).then(this.ondata).catch(this.onerror);
    } catch (e) {
      this.onerror(e);
    }
  }
};
