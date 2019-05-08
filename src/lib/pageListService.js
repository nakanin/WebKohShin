'use strict';

const fs = require('fs');
const request = require('request-promise-native');
const crypto = require('crypto')
const cheerio = require('cheerio')
const Diff = require('text-diff');

const filename = 'pageList.json'
const requestConfigFilename = 'requestConfig.json'

const STATUS_NO_CHANGE = "noChange";
const STATUS_CHANGED = "changed";
const STATUS_ERROR = "error";

const RAW_DIR = "raw/";

const md5hex = (str) => {
  const md5 = crypto.createHash('md5')
  return md5.update(str, 'binary').digest('hex')
};

const getText = (html) => {
  const $ = cheerio.load(html);
  return $('body').text().replace(/\s\s+/g, ' ');
}

const getFilename = (url) => {
  const specialChars = /\:|\?|\.|"|<|>|\|/g;   //使用できない特殊文字
  const slash        = /\//g;                  //単一のスラッシュ
  const spaces       = /\s\s+/g;               //連続したスペース
  const hyphens      = /-+/g;                  //連続したハイフン
  return url
    .replace(specialChars, '-')
    .replace(slash, '-')
    .replace(spaces, '-')
    .replace(hyphens, '-')
    .substr(0, 50);
}

const saveText = (url, text) => {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR);
  }

  const filename = getFilename(url);
  const filepath = RAW_DIR + filename + '.txt';

  if (fs.existsSync(filepath)) {
    const backupPath = RAW_DIR + filename + '_old.txt';
    fs.renameSync(filepath, backupPath);
  }
  fs.writeFileSync(filepath, text, 'utf-8');
}

const getDiff = (url, newtext) => {
  const diff = new Diff();
  const filepath = RAW_DIR + getFilename(url) + '_old.txt';
  const oldtext = fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : '';
  const textDiff = diff.main(oldtext, newtext);
  return diff.prettyHtml(textDiff);
};

const writeFile = (list) => {
  fs.writeFileSync(filename, JSON.stringify(list, null, '    '), 'utf-8');
};

const getRequestConfig = () => {
  if (fs.existsSync(requestConfigFilename)) {
    return JSON.parse(fs.readFileSync(requestConfigFilename, 'utf-8'));
  } else {
    return {};
  }
};

const pageListService = {
  STATUS_NO_CHANGE: STATUS_NO_CHANGE,
  STATUS_CHANGED: STATUS_CHANGED,
  STATUS_ERROR: STATUS_ERROR,
  getList: function () {
    if (fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } else {
      return [];
    }
  },
  addUrl: function (url) {
    let list = this.getList();
    list.push({
      url: url,
      status: null,
      lastTime: null
    });
    writeFile(list);
    return list;
  },
  deleteUrl: function (url) {
    let list = this.getList().filter(page => page.url !== url);
    writeFile(list);
    return list;
  },
  checkUpdate: function () {
    let requests = [];
    let config = getRequestConfig();

    this.getList().forEach(page => {
      requests.push(
        request.get(page.url, config)
          .then(html => {
            const text = getText(html);
            saveText(page.url, text);

            const hash = md5hex(text);
            if (hash === page.hash) {
              page.status = STATUS_NO_CHANGE;
            } else {
              page.status = STATUS_CHANGED;
              page.hash = hash;
              page.diff = getDiff(page.url, text);
              page.lastModified = Date.now();
            }
            page.lastTime = Date.now();
            delete page.error;
            return page;
          })
          .catch(error => {
            page.error = error;
            page.status = STATUS_ERROR;
            page.lastTime = Date.now();
            return page;
          })
      );
    });
    return Promise.all(requests)
      .then(responses => {
        writeFile(responses);
        return responses;
      });
  }
};

module.exports = pageListService;
