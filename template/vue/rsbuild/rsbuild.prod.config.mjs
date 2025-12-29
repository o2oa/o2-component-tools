import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import path from 'node:path'
import fs from 'fs/promises'
import UglifyJS from 'uglify-js'
import { pluginUmd } from '@rsbuild/plugin-umd'

const pkgPath = path.resolve(process.cwd(), 'package.json')
const pkgJson = JSON.parse(readFileSync(pkgPath))
const componentPath = pkgJson.name
const componentName = componentPath
  .replace('x_component_', '')
  .split('_')
  .join('.')

const getOutDir = () => {
  switch (process.env.npm_lifecycle_event) {
    case 'o2-build':
      return `../../../target/o2server/servers/webServer/${componentPath}`
    case 'o2-deploy':
      return `../../dest/${componentPath}`
    default:
      return `dist/${componentPath}`
  }
}
const outDir = getOutDir()

function getAllFiles(dir, files_ = [], nest = false) {
  const files = readdirSync(dir)
  for (const i in files) {
    const name = path.join(dir, files[i])
    if (existsSync(name)) {
      if (statSync(name).isDirectory()) {
        if (nest) getAllFiles(name, files_, nest)
      } else {
        files_.push(name)
      }
    }
  }
  return files_
}

function includeMain(relativePath, extname, nest) {
  const dir = path.resolve(`${process.cwd()}`, `${outDir}/${relativePath}/`)
  if (existsSync(dir)) {
    return getAllFiles(dir, [], nest)
      .filter(file => {
        return path.extname(file) === extname
      })
      .map(file => {
        return `'../${componentPath}/${relativePath}${file.replace(dir, '').replace(/\\/g, '/')}'`.replace(
          /\/\//g,
          '/'
        )
      })
  } else {
    return []
  }
}

function findLp(relativePath, extname, nest) {
  const dir = path.resolve(`${process.cwd()}`, `${outDir}/${relativePath}/`)
  if (existsSync(dir)) {
    return getAllFiles(dir, [], nest)
      .filter(file => {
        return path.extname(file) === extname && !file.endsWith('.min.js')
      })
      .map(filePath => {
        return filePath
      })
  } else {
    return []
  }
}

function generateMiniLP() {
  const lps = findLp('lp', '.js', false)
  lps.forEach(lpPath => {
    const o = path.parse(lpPath)

    const toPath = path.resolve(`${o.dir}`, `${o.name}.min${o.ext}`)
    fs.readFile(lpPath).then(
      data => {
        const miniContent = UglifyJS.minify(data.toString()).code
        fs.writeFile(toPath, miniContent, 'utf8').catch(err => {
          console.error('Failed to write file lp.min.js:', err)
        })
      },
      err => {
        console.error('Failed to read file lp.min.js:', err)
      }
    )
  })
}

function generateMain() {
  let mainFileContent = `o2.component("${componentName}", {\n`

  const maincsss = includeMain('$Main/css', '.css', false)
  const csss = includeMain('', '.css', false).concat(maincsss)
  if (csss.length) mainFileContent += `    css: [${csss.join(', ')}],\n`

  const jss = includeMain('$Main/js', '.js', false)
  if (jss.length) mainFileContent += `    js: [${jss.join(', ')}],\n`

  mainFileContent += `});`

  const filePath = path.resolve(`${process.cwd()}`, outDir, `Main.js`)
  fs.writeFile(filePath, mainFileContent, 'utf8').catch(err => {
    console.error('Failed to generate Main.js:', err)
  })

  const miniFileContent = UglifyJS.minify(mainFileContent).code
  const minFilePath = path.resolve(`${process.cwd()}`, outDir, `Main.min.js`)
  fs.writeFile(minFilePath, miniFileContent, 'utf8').catch(err => {
    console.error('Failed to generate Main.min.js:', err)
  })
}

const generateMainPlugin = () => ({
  name: 'generate-file',
  setup(api) {
    api.onCloseBuild(() => {
      generateMain()
      generateMiniLP()
    })
  },
})

const prodConfig = {
  plugins: [
    pluginUmd({
      name: `${componentName}`,
    }),
    generateMainPlugin(),
  ],
  source: {
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    },
  },
  output: {
    emitAssets: true,
    assetPrefix: `../${componentPath}/`,
    distPath: {
      root: outDir,
      js: '$Main/js',
      jsAsync: '$Main/js/async',
      css: '$Main/css',
      cssAsync: '$Main/css/async',
      svg: '$Main/svg',
      font: '$Main/font',
      wasm: '$Main/wasm',
      image: '$Main/image',
      media: '$Main/media',
      assets: '$Main/assets',
    },
    cleanDistPath: true,
    sourceMap: true,
  },
}

export default prodConfig
