# umi-plugin-locale-generator

编写一个多语言 `json` 文件，配置插件，启动项目即可自动生成 `umi-plugin-locale` 多语言所需代码结构。

插件刚开始编写，想要体验的小伙伴可以按下面步骤进行体验：

``` bash
# step 1
$ git clone https://github.com/seiwhale/umi-plugin-locale-generator.git`

# step 2
$ cd umi-plugin-locale-generator

# step 3
yarn

# step 4
yarn build

# step 5
# 将 lib 文件夹下的文件黏贴到项目中
# 按照 umi 官网进行插件配置
# 链接：https://umijs.org/zh/config/#plugins

# step 6
# 在项目中 src 下编写 _locales 文件夹
# 在 _locales 文件夹中编写对应翻译 json，格式如下：
# 
# test.js
# {
#  "s1": {
#    "zh-CN": "ZH-CN-S1",
#    "en-US": "EN-US-S1"
#  }
#}

# step 7
yarn start
```

## Configuration

Configure in `.umirc.js`,

```js
export default {
  plugins: [
    ['umi-plugin-locale-generator', options],
  ],
}
```

## Options

TODO

## LICENSE

MIT
