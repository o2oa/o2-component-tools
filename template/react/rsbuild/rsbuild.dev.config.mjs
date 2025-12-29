import path from 'node:path'
import { readFileSync, existsSync } from 'fs'
import fs from 'fs/promises'
import axios from 'axios'

const pkgPath = path.resolve(process.cwd(), 'package.json')
const pkgJson = JSON.parse(readFileSync(pkgPath))
const componentPath = pkgJson.name
const componentName = componentPath
  .replace('x_component_', '')
  .split('_')
  .join('.')

const devConfig = {
  dev: {
    cliShortcuts: true,
  },
  server: {
    host: '0.0.0.0',
    port: 7979,
  },
  output: {
    manifest: true,
  },
}

let proxyTarget = ''
const configPath = path.resolve(process.cwd(), 'o2.config.json')
const o2config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath))
  : {}
if (o2config && o2config.devServer) {
  const server = o2config.devServer
  proxyTarget = `${server.https ? 'https' : 'http'}://${server.host}${!server.port || server.port === '80' || server.port === '443' ? '' : `:${server.port}`}`
}

if (proxyTarget) {
  let domain = ''
  const getDomainPlugin = () => ({
    name: 'configure-server',
    setup(api) {
      api.onBeforeStartDevServer(({ server }) => {
        server.middlewares.use((req, res, next) => {
          const referer = req.headers['referer']
          if (referer) {
            const matches = referer.match(/(?<=:\/\/)([^\/\r\n:]+)/)
            if (matches && matches[0] !== domain) {
              domain = matches[0]
            }
          }
          next()
        })
      })
    },
  })

  const o = {
    target: proxyTarget,
    changeOrigin: true,
  }
  Object.defineProperty(o, 'cookieDomainRewrite', {
    configurable: true,
    enumerable: true,
    get() {
      return domain
    },
  })

  devConfig.server.proxy = {
    '/o2_core': { target: proxyTarget, changeOrigin: true },
    '/o2_lib': { target: proxyTarget, changeOrigin: true },
    '/x_desktop': { target: proxyTarget, changeOrigin: true },
    '/x_component': { target: proxyTarget, changeOrigin: true },
    '/o2api': { target: proxyTarget, changeOrigin: true },
    '/x_app_center/ws': { target: proxyTarget, changeOrigin: true, ws: true },
    '/x_': o,
  }

  const getRunComponentFunStr = () => {
    return `
    var runComponent = function(name, res){
      o2.xApplication = o2.xApplication || {};
      var names = name.split(".");
      var o = o2.xApplication;
      names.forEach(function(n){
        o = o[n] = o[n] || {};
      });
      o.loading = new Promise(function(resolve){
        o2.loadAll(res, {evalScripts:true, url: true, type:"module"}, function(){ resolve(); });
      })
    }
    `
  }

  let host = proxyTarget
  const parseContentPlugin = () => ({
    name: 'parse-content',
    setup(api) {
      api.onBeforeStartDevServer(({ server, environments }) => {
        server.middlewares.use((req, res, next) => {

          let js, css, jsTags, cssTags
          try {
            js = environments.web.manifest.entries.index.initial?.js || [
              '/static/js/index.js',
            ]
            jsTags = js
              .map(item => `<script defer src="${item}"></script>`)
              .join('\n')
            css = environments.web.manifest.entries.index.initial?.css || [
              '/static/css/index.css',
            ]
            cssTags = css
              .map(item => `<link rel="stylesheet" href="${item}">`)
              .join('\n')
          } catch (error) {
            console.error('Failed to get manifest:', error)
            return next()
          }
          if (
            req.url.startsWith('/x_desktop/app.html') ||
            (req.url.startsWith('/x_desktop/index.html') &&
              req.url.includes(componentName))
          ) {
            const htmlUrl = new URL(req.url, host)
            axios
              .get(htmlUrl.toString())
              .then(html => {
                const htmlContent = html.data
                const headIndex = htmlContent.indexOf('<head>')
                const newHtmlContent =
                  htmlContent.slice(0, headIndex + 6) +
                  jsTags +
                  cssTags +
                  htmlContent.slice(headIndex + 6)

                res.setHeader('Content-Type', 'text/html')
                res.end(newHtmlContent, 'utf8')
              })
              .catch(error => {
                res.statusCode = 500
                res.end(`get remote html file error: ${error.message}`)
              })
          } else if (req.url.match(`/${componentPath}/lp/*`)) {
            let toUrl = path
              .basename(req._parsedUrl.pathname)
              .replace(/min\./, '')
            toUrl = path.resolve(process.cwd(), 'public', './lp/' + toUrl)
            fs.readFile(toUrl).then(
              data => {
                res.setHeader(
                  'Content-Type',
                  'application/javascript; charset=UTF-8'
                )
                res.end(data, 'utf8')
              },
              () => {
                res.end('')
              }
            )
          } else if (req.url.match(`/${componentPath}/Main*`)) {
            const script = `
                      ${getRunComponentFunStr()}
                      runComponent("${componentName}", {
                        js: ['/static/js/index.js'],
                      });
                      `
            res.setHeader(
              'Content-Type',
              'application/javascript; charset=UTF-8'
            )
            res.end(script, 'utf8')
          } else if (req.url === `/${componentPath}/$Main/default/style.css`) {
            const toUrl = path.resolve(
              process.cwd(),
              'public',
              '$Main/default/style.css'
            )
            fs.readFile(toUrl).then(
              data => {
                res.setHeader('Content-Type', 'text/css; charset=UTF-8')
                res.end(data, 'utf8')
              },
              () => {
                res.end('')
              }
            )
          } else {
            next()
          }
        })
      })
    },
  })
  devConfig.plugins = [getDomainPlugin(), parseContentPlugin()]
}

export default {
  ...devConfig,
  html: {
    meta: {
      charset: { charset: 'utf-8' },
      'http-equiv': {
        'http-equiv': 'refresh',
        content:
          `0;url=/x_desktop/index.html?app=${componentName}&default=false&debugger`,
      },
    },
  },
}
