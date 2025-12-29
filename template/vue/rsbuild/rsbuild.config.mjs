import { defineConfig, mergeRsbuildConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import devConfig from './rsbuild.dev.config'
import prodConfig from './rsbuild.prod.config'

export default defineConfig(({ envMode }) => {
  const config = envMode === 'development' ? devConfig : prodConfig
  const mergedConfig = mergeRsbuildConfig(config, {
    plugins: [pluginVue()],
    // Your config here
  })
  return mergedConfig
})
