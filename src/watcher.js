const fs = require('fs');
const nodeWatch = require('node-watch');
const convert = require('./markdown');

const MarkdownFilePattern = /^[^.].*.md$/;
const readMarkdownFiles = (path) => {
  const stat = fs.statSync(path);
  if (stat.isDirectory()) {
    // 也可以把files渲染markdown的列表，自由度很高
    return fs.promises.readdir(path).then(
      (files) => files.filter((filename) => MarkdownFilePattern.test(filename)),
    );
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
