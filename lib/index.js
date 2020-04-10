"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.getLocaleFiles = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('path'),
    join = _require.join;

var _require2 = require('fs'),
    existsSync = _require2.existsSync,
    readdirSync = _require2.readdirSync,
    statSync = _require2.statSync,
    mkdirSync = _require2.mkdirSync,
    readFileSync = _require2.readFileSync,
    writeFile = _require2.writeFile;
/**
 * Get locale files
 */


var getLocaleFiles = function getLocaleFiles(absSrcPath, singular) {
  // locale file list
  var localeList = [];
  var localePath = join(absSrcPath, singular ? '_locale' : '_locales');

  if (existsSync(localePath)) {
    // if exist
    var localePaths = readdirSync(localePath);

    for (var i = 0; i < localePaths.length; i++) {
      var path = localePaths[i];
      var fullPath = join(localePath, path);
      var stats = statSync(fullPath);
      var fileInfo = /^(.+)\.(json)$/.exec(localePaths[i]);

      if (stats.isFile()) {
        // push file into localeList
        localeList.push({
          fullPath: fullPath,
          name: fileInfo[1]
        });
      }
    }
  }

  return localeList;
};
/**
 * 插件主函数
 * @param api
 * @param options
 */


exports.getLocaleFiles = getLocaleFiles;

function _default(api, options) {
  options = options || {}; // 监听插件配置变化

  api.onOptionChange(function (newOpts) {
    options = newOpts;
    api.rebuildTmpFiles();
  });
  var beforeDevServer = api.beforeDevServer,
      addPageWatcher = api.addPageWatcher,
      config = api.config,
      paths = api.paths;
  var singular = config.singular;
  var absSrcPath = paths.absSrcPath;
  var _options = options,
      _options$path = _options.path,
      path = _options$path === void 0 ? './' : _options$path,
      _options$languages = _options.languages,
      languages = _options$languages === void 0 ? ['zh-CN', 'en-US'] : _options$languages;
  var localeFiles = getLocaleFiles(join(absSrcPath, path), singular); // beforeDevServer

  beforeDevServer(function () {
    var localePath = join(absSrcPath, singular ? 'locale' : 'locales'); // 创建多语言文件夹

    for (var i = 0; i < languages.length; i++) {
      var lang = languages[i];
      var stats = statSync(join(localePath, lang));
      if (!stats.isDirectory()) mkdirSync(join(localePath, lang));
    } // 申明入口文件数据


    var indexHeaderData = [];
    var indexFooterData = [];
    /**
     * 遍历文件
     *  1、以文件名创建对应文件夹
     *  2、解析文件内容，在每个文件夹下创建对应语言文件
     **/

    for (var _i = 0; _i < localeFiles.length; _i++) {
      var file = localeFiles[_i];
      var fullPath = file.fullPath,
          name = file.name;
      var fileBuffer = readFileSync(fullPath, 'utf-8');
      var fileString = fileBuffer.toString();

      try {
        (function () {
          var fileData = JSON.parse(fileString);

          var _loop = function _loop(j) {
            var lang = languages[j];
            var langPath = join(localePath, lang);
            var langName = lang.replace(/^([a-z]{2})-([A-Z]{2})$/, '$1$2');

            var langData = _defineProperty({}, langName, {}); //入口文件数据保存


            indexHeaderData.push("import ".concat(name, " from './").concat(lang, "/").concat(name, "';\n"));
            indexFooterData.push("...".concat(name, ",\n")); // 循环文件内容

            Object.keys(fileData).forEach(function (key) {
              langData[langName][key] = fileData[key][lang];
            });
            var writeDataArr = Object.entries(langData[langName]);
            var writeData = "export default {\n";
            writeDataArr.forEach(function (item, index) {
              writeData += "\t".concat(item[0], ": \"").concat(item[1], "\",\n");
            });
            writeData += '}';
            writeFile("".concat(join(langPath, name), ".js"), writeData, function (err, data) {
              if (err) {
                throw err;
              }
            });
          };

          for (var j = 0; j < languages.length; j++) {
            _loop(j);
          }
        })();
      } catch (error) {
        console.error(error);
      }
    }
    /**
     * 创建入口文件
     */


    for (var _i2 = 0; _i2 < languages.length; _i2++) {
      var _lang = languages[_i2];
      var headerStr = '';
      var footerStr = '';

      for (var j = 0; j < indexHeaderData.length; j += languages.length) {
        var headerEle = indexHeaderData[j];
        var footerEle = indexFooterData[j];
        headerStr += headerEle;
        footerStr += footerEle;
      }

      var indexData = "".concat(headerStr, "\nexport default {\n\t").concat(footerStr, "}");
      writeFile("".concat(localePath, "/").concat(_lang, ".js"), indexData, function (err, data) {
        if (err) {
          throw err;
        }
      });
    }
  }); // 添加对 _locale 文件的 watch

  addPageWatcher(join(absSrcPath, config.singular ? '_locale' : '_locales')); // Example: output the webpack config

  api.chainWebpackConfig(function (config) {// console.log(config.toString());
  });
}