import { defineConfig, mergeRsbuildConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import devConfig from './rsbuild.dev.config'
import prodConfig from './rsbuild.prod.config'

export default defineConfig(({ envMode }) => {
  const config = envMode === 'development' ? devConfig : prodConfig
  const mergedConfig = mergeRsbuildConfig(config, {
    plugins: [pluginReact()],
    // Your config here
  })
  return mergedConfig
})
