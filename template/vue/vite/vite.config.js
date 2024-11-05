import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, existsSync, statSync, readdirSync } from "fs"
import path from "node:path";
import fs from "fs/promises";
import UglifyJS from "uglify-js";

const isProduction = process.env.NODE_ENV === 'production';
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkgJson = JSON.parse(readFileSync(pkgPath));
const componentPath = pkgJson.name;
const componentName = componentPath.replace('x_component_', '').split('_').join('.');

const viteConfig = {
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }
  },
  build: {
    emitAssets: true,
    assetsDir: '$Main',
    outDir: `dist/${componentPath}`,
    sourcemap: true,
    lib: {
      entry: ['src/main.js'],
      name: `${componentName}`,
      formats: ['umd'],
      fileName: (format, entryName) => {
        return `$Main/js/${entryName}.js`;
      },
      // cssFileName: '$Main/css/style.css',
    }
  },
  server: {
    fs: {
      // 允许为项目根目录的上一级提供服务
      allow: ['..']
    },
    // https: {
    //     key: readFileSync('key.pem'),
    //     cert: readFileSync('cert.pem'),
    //     passphrase: '1234', // 将此行替换为您的密码
    // },
    host: '0.0.0.0',
    port: '5556'
  },
  // assetsInclude: ['**/*.html']
}

let proxyTarget = '';
const configPath = path.resolve(process.cwd(), 'o2.config.json');
const o2config = (existsSync(configPath)) ? JSON.parse(readFileSync(configPath)) : {};
if (o2config && o2config.devServer){
  const p = o2config.devServer.https ? 'https' : 'http';
  const h = o2config.devServer.host;
  const port = o2config.devServer.port ? ':'+o2config.devServer.port : '';
  proxyTarget = `${p}://${h}${port}`;
}

if (proxyTarget){
  let domian = '';
  const getDomainPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const r = req.headers['referer'];
        if (r) {
          const matchs = r.match(/(?<=:\/\/)([^\/\r\n:]+)/);
          if (matchs[0] !== domian) domian = matchs[0];
        }
        next();
      })
    },
  })

  const o={
    target: proxyTarget, changeOrigin: true
  }
  Object.defineProperty(o, 'cookieDomainRewrite', {
    configurable: true,
    enumerable: true,
    get(){
      return domian;
    }
  });

  viteConfig.server.proxy = {
    '/o2_core': {target: proxyTarget, changeOrigin: true},
    '/o2_lib': {target: proxyTarget, changeOrigin: true},
    '/x_desktop': {target: proxyTarget, changeOrigin: true},
    '/x_component': {target: proxyTarget, changeOrigin: true},
    '/o2api': {target: proxyTarget, changeOrigin: true},
    '/x_app_center/ws': {target: proxyTarget, changeOrigin: true, ws: true},
    '/x_': o
  };


  function getAllFiles(dir, files_ = [], nest=false) {
    const files = readdirSync(dir);
    for (const i in files) {
      const name = path.join(dir, files[i]);
      if( existsSync(name) ){
        if (statSync(name).isDirectory()) {
          if(nest)getAllFiles(name, files_, nest);
        } else {
          files_.push(name);
        }
      }
    }
    return files_;
  }

  function includeMain(relativePath, extname, nest){
    const dir = path.resolve(`${process.cwd()}`, `./dist/${componentPath}/${relativePath}/`);
    if (existsSync(dir)) {
      return getAllFiles(dir, [], nest).filter(file =>{
        return path.extname(file) === extname;
      }).map(file =>{
        return `'../${componentPath}/${relativePath}${file.replace(dir, '').replace(/\\/g, '/')}'`
            .replace(/\/\//g, '/');
      });
    }else{
      return []
    }
  }

  function findLp(relativePath, extname, nest){
    const dir = path.resolve(`${process.cwd()}`, `./dist/${componentPath}/${relativePath}/`);
    if (existsSync(dir)) {
      return getAllFiles(dir, [], nest).filter(file =>{
        return path.extname(file) === extname;
      }).map(file =>{
        return `/${componentPath}/${relativePath}${file.replace(dir, '').replace(/\\/g, '/')}`
            .replace(/\/\//g, '/');
      });
    }else{
      return []
    }
  }

  function generateMiniLP(){
    const lps = findLp('lp', '.js', false);
    lps.forEach(lp => {
      const fromPath = path.resolve(`${process.cwd()}`, `./dist${lp}` );

      const o = path.parse(lp);
      const toPath = path.resolve(`${process.cwd()}`, `./dist${o.dir}/${o.name}.min${o.ext}` );

      fs.readFile(fromPath).then((data)=>{
        const miniContent = UglifyJS.minify(data.toString()).code;
        fs.writeFile(toPath, miniContent, 'utf8').catch((err) => {
          console.error('Failed to write file lp.min.js:', err);
        })
      }, (err) => {
        console.error('Failed to read file lp.min.js:', err);
      });
    })
  }

  function generateMain(){
    let mainFileContent = `o2.component("${componentName}", {\n`;

    const maincsss = includeMain('$Main/css', '.css', false);
    const csss = includeMain('', '.css', false).concat(maincsss);
    if (csss.length) mainFileContent += `    css: [${csss.join(", ")}],\n`;

    const jss = includeMain('$Main/js', '.js', false);
    if (jss.length) mainFileContent += `    js: [${jss.join(", ")}],\n`;

    mainFileContent += `});`;

    const filePath = path.resolve(`${process.cwd()}`, `./dist/${componentPath}`, `Main.js`);
    fs.writeFile(filePath, mainFileContent, 'utf8').catch((err) => {
      console.error('Failed to generate Main.js:', err);
    });

    const miniFileContent = UglifyJS.minify(mainFileContent).code;
    const minFilePath = path.resolve(`${process.cwd()}`, `./dist/${componentPath}`, `Main.min.js`);
    fs.writeFile(minFilePath, miniFileContent, 'utf8').catch((err) => {
      console.error('Failed to generate Main.min.js:', err);
    });
  }

  function generateMainPlugin() {
    return {
      name: 'generate-file',
      closeBundle() {
        if( !isProduction )return;

        generateMain();
        generateMiniLP();

      },
    };
  }


  function getRunComponentFunStr(){
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

  const praseContentPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {

        if( req.url.match(`/${componentPath}/lp/*`) ){

          let toUrl =  path.basename(req._parsedUrl.pathname).replace(/min\./, '')
          toUrl = path.resolve(process.cwd(), 'public', './lp/'+toUrl);
          fs.readFile(toUrl).then((data)=>{
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.end(data, 'utf8');
          }, ()=>{
            res.end('');
          });

        }else if( req.url.match(`/${componentPath}/Main*`) ){

          const script = `
            ${getRunComponentFunStr()}
            runComponent("${componentName}", {
              js: ['../src/main.js']
            });
            `;
          res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
          res.end(script, 'utf8');

        }else if( req.url === `/${componentPath}/$Main/default/style.css` ){

          const toUrl = path.resolve(process.cwd(), 'public', '$Main/default/style.css');
          fs.readFile(toUrl).then((data)=>{
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            res.end(data, 'utf8');
          }, ()=>{
            res.end('');
          });

        }else{

          next();

        }


      })
    }
  })


  viteConfig.plugins = [
    vue(),
    getDomainPlugin(),
    praseContentPlugin(),
    generateMainPlugin(),
  ];
}

// https://vite.dev/config/
export default defineConfig(viteConfig)
