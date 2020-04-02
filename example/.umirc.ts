import { join } from 'path';
import { IConfig } from 'umi-types';

export default {
  routes: [
    { path: '/', component: './index' },
  ],
  plugins: [
    join(__dirname, '..', require('../package').main || 'src/index.js'),
  ],
} as IConfig;
