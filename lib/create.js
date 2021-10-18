import options from './options.js';
import fs from 'fs/promises';
import vueCreate from '@vue/cli/lib/create.js';
import writeFileTree from '@vue/cli/lib/util/writeFileTree.js';
import fetch from 'node-fetch';
import JSZip from 'jszip';
import chalk from 'chalk';
import child_process from 'child_process';

const templateProjectName = options.template.project[options.framework];
const templateGitAddress = options.template.git+templateProjectName;
const o2publicGitAddress = options.dependency.git;


let componentName = '';
let componentPath = '';

async function get(url) {
    try{
        const res = await fetch(url);
        if (res.ok) {
            return await res.buffer();
        } else {
            const msg = 'Request Failed. Status Code: ' + res.status;
            console.error(msg);
        }
    }catch{}
}
async function getZipFile(url) {
    const buf = await get(url);
    if (buf){
        return await JSZip.loadAsync(buf);
    }
}
async function copyFile(zip, path, to) {
    const base = `${templateProjectName}-master`;
    try {
        const file = zip.file(`${base}/${path}`);
        const text = await file.async('array');
        const buf = Buffer.from(text);
        const o = {};
        o[to] = buf;
        await writeFileTree(`./${componentPath}`, o);
        console.log(`${chalk.green('√')} Get ${to} success`);
    }catch(e) {
        console.error(`${chalk.red('×')} Get ${chalk.red(to)} error:`);
        console.error(e);
    }
}
async function copyFolder(zip, path, to) {
    let ps = [];
    zip.folder(`${templateProjectName}-master/${path}`).forEach(function (relativePath, file){
        if (!file.dir){
            let p = path+"/"+relativePath;
            let toPath = (to || path)+"/"+relativePath;
            ps.push(copyFile(zip, p, toPath));
        }
    });
    await Promise.all(ps);
}

async function replaceComponentName(path, file){
    let text = await fs.readFile(`./${path}/${file}`, {'encoding': 'utf8'});
    text = text.replace(/<%= componentName %>/g, componentName);
    const o = {};
    o[file] = text;
    await writeFileTree(`./${path}`, o);
}

async function getZipFileJson(zip, path){
    const base = `${templateProjectName}-master`;
    const file = zip.file(`${base}/${path}`);
    const text = await file.async('string');
    console.log(text);
    return JSON.parse(text);
}

class componentFactory{
    static async vue3(name, opts) {
        componentName = name;
        componentPath = 'x_component_'+name.replace(/\./g, '_');
        let o = (opts || {});
        //o.preset = '__default_vue_3__';
        //await vueCreate(componentPath, o);

        console.log();

        const url = `${templateGitAddress}/-/archive/master/${templateProjectName}-master.zip`;
        const zip = await getZipFile(url);
        if (!zip){
            console.error('error !')
        }else{
            const envJson = await getZipFileJson(zip,'env.json');
            const pkg = JSON.parse(await fs.readFile(`./${componentPath}/package.json`, {'encoding': 'utf8'}));
            const dependencies = envJson.dependencies;
            Object.keys(dependencies).forEach((k)=>{
                pkg.devDependencies[k] = dependencies[k];
            })
            await writeFileTree(`./${componentPath}`, {
                'package.json': JSON.stringify(pkg, null, 2)
            });

            await Promise.all([
                copyFile(zip, '.gitignore', '.gitignore'),
                copyFile(zip, 'vue.config.js', 'vue.config.js'),
                copyFile(zip, 'o2.config.json', 'o2.config.json'),
                copyFile(zip, 'public/favicon.ico', 'public/favicon.ico'),
                copyFile(zip, 'public/index.html', 'public/index.html'),
                copyFolder(zip, 'src'),
                copyFolder(zip, 'public/x_component', 'public/'+componentPath),
            ]);
            await Promise.all([
                replaceComponentName(componentPath, 'src/main.js'),
                replaceComponentName(`./${componentPath}/public/${componentPath}/lp`, 'zh-cn.js')
            ]);

            // child_process.exec(`cd ${componentPath}`, (err, stdout, stderr) => {
            //     if (err){
            //         console.warn(new Date(),'[ERROR] Run 1pm install Error:');
            //         console.log(err);
            //     }else{
            //         child_process.exec('npm install', (err, stdout, stderr) => {
            //             if (err){
            //                 console.warn(new Date(),'[ERROR] Run 1pm install Error:');
            //                 console.log(err);
            //             }else{
            //                 console.log();
            //                 console.log(`${chalk.green('O2OA Comonent "'+name+'" Created!')}`);
            //             }
            //         });
            //     }
            // });

        }
    }
}

export default componentFactory[options.framework] || function(){
    console.log(`${chalk.red('[ERROR] Does not support using '+options.framework+' to create O2OA Components')}`);
};
