// ref:
// - https://umijs.org/plugin/develop.html
import { IApi } from 'umi-types';
const { join } = require('path');
const {
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  readFileSync,
  writeFile
} = require('fs');

/**
 * 插件配置项
 */
export interface IOptions {
  /**
   * _locale 文件路径 - 相对于 src 目录，若 src 不存在，则相对于项目根目录
   * @description
   *  - 未填写则默认在 "src/_locale[s]" 下
   *  - 如果在 "src/test/_locale[s]" 下, 则 path 为 "./test"
   **/
  path?: string;
  /** Language name list */
  languages?: string[];
}
export interface LocaleItem {
  name: string;
  fullPath: string;
}
type GetLocalFiles = (absSrcPath: string, singular: boolean) => LocaleItem[];

/**
 * Get locale files
 */
export const getLocaleFiles: GetLocalFiles = (
  absSrcPath: string,
  singular: boolean
) => {
  // locale file list
  const localeList: LocaleItem[] = [];
  const localePath = join(absSrcPath, singular ? '_locale' : '_locales');

  if (existsSync(localePath)) {
    // if exist
    const localePaths = readdirSync(localePath);
    for (let i = 0; i < localePaths.length; i++) {
      const path = localePaths[i];
      const fullPath = join(localePath, path);
      const stats = statSync(fullPath);
      const fileInfo = /^(.+)\.(json)$/.exec(localePaths[i]);

      if (stats.isFile()) {
        // push file into localeList
        localeList.push({
          fullPath,
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
export default function(api: IApi, options: IOptions) {
  options = options || {};

  // 监听插件配置变化
  api.onOptionChange(newOpts => {
    options = newOpts;
    api.rebuildTmpFiles();
  });

  const { beforeDevServer, addPageWatcher, config, paths } = api;
  const { singular } = config;
  const { absSrcPath } = paths;
  const { path = './', languages = ['zh-CN', 'en-US'] } = options;
  const localeFiles = getLocaleFiles(join(absSrcPath, path), singular);

  // beforeDevServer
  beforeDevServer(() => {
    const localePath = join(absSrcPath, singular ? 'locale' : 'locales');

    // 创建多语言文件夹
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      const stats = statSync(join(localePath, lang));
      if (!stats.isDirectory()) mkdirSync(join(localePath, lang));
    }

    // 申明入口文件数据
    const indexHeaderData = [];
    const indexFooterData = [];

    /**
     * 遍历文件
     *  1、以文件名创建对应文件夹
     *  2、解析文件内容，在每个文件夹下创建对应语言文件
     **/
    for (let i = 0; i < localeFiles.length; i++) {
      const file = localeFiles[i];
      const { fullPath, name } = file;
      const fileBuffer: Buffer = readFileSync(fullPath, 'utf-8');
      const fileString: string = fileBuffer.toString();

      try {
        const fileData = JSON.parse(fileString);

        for (let j = 0; j < languages.length; j++) {
          const lang = languages[j];
          const langPath = join(localePath, lang);
          const langName = lang.replace(/^([a-z]{2})-([A-Z]{2})$/, '$1$2');
          const langData = {
            [langName]: {}
          };

          //入口文件数据保存
          indexHeaderData.push(`import ${name} from './${lang}/${name}';\n`);
          indexFooterData.push(`...${name},\n`);

          // 循环文件内容
          Object.keys(fileData).forEach(key => {
            langData[langName][key] = fileData[key][lang];
          });

          const writeDataArr = Object.entries(langData[langName]);
          let writeData = `export default {\n`;
          writeDataArr.forEach((item, index) => {
            writeData += `\t${item[0]}: "${item[1]}",\n`;
          });
          writeData += '}';

          writeFile(`${join(langPath, name)}.js`, writeData, (err, data) => {
            if (err) {
              throw err;
            }
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    /**
     * 创建入口文件
     */
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      let headerStr = '';
      let footerStr = '';
      for (let j = 0; j < indexHeaderData.length; j += languages.length) {
        const headerEle = indexHeaderData[j];
        const footerEle = indexFooterData[j];
        headerStr += headerEle;
        footerStr += footerEle;
      }

      const indexData = `${headerStr}\nexport default {\n\t${footerStr}}`;

      writeFile(`${localePath}/${lang}.js`, indexData, (err, data) => {
        if (err) {
          throw err;
        }
      });
    }
  });

  // 添加对 _locale 文件的 watch
  addPageWatcher(join(absSrcPath, config.singular ? '_locale' : '_locales'));

  // Example: output the webpack config
  api.chainWebpackConfig(config => {
    // console.log(config.toString());
  });
}
