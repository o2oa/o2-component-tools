import { defineConfig } from 'vite';
import devConfig from './vite.dev.js';
import prodConfig from './vite.prod.js';
import _ from 'lodash';

export default ({ mode }) => {
  const config = mode === 'production' ? prodConfig : devConfig;
  return defineConfig(_.merge(config, {
    //您的配置
  }));
};
