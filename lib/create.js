import options from './options.js';
import fs from 'fs/promises';
import vueCreate from '@vue/cli/lib/create.js';
import writeFileTree from '@vue/cli/lib/util/writeFileTree.js';
import fetch from 'node-fetch';
import JSZip from 'jszip';
import chalk from 'chalk';

const projectName = options.git.templates[options.framework];
const gitAddress = options.git.group+projectName;

async function get(url) {
    try{
        const res = await fetch(url);
        if (res.ok) {
            const o = await res.buffer();
            return o;
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
async function copyFile(zip, path, to, name) {
    const base = `${projectName}-master`;
    try {
        const file = zip.file(`${base}/${path}`);
        const text = await file.async('array');
        const buf = Buffer.from(text);
        const o = {};
        o[to] = buf;
        await writeFileTree(`./${name}`, o);
        console.log(`${chalk.green('√')} Get ${to} success`);
    }catch(e) {
        console.error(`${chalk.red('×')} Get ${chalk.red(to)} error:`);
        console.error(e);
    }
}

async function copyFolder(zip, path, name) {
    let ps = [];
    zip.folder(`${projectName}-master/${path}`).forEach(function (relativePath, file){
        if (!file.dir){
            let p = path+"/"+relativePath;
            ps.push(copyFile(zip, p, p, name));
        }
    });
    await Promise.all(ps);
}

class componentFactory{
    static async vue3(name, opts) {
        //await vueCreate(name, (opts || {}));

        const pkg = JSON.parse(await fs.readFile(`./${name}/package.json`, {'encoding': 'utf8'}));
        pkg.devDependencies['@o2oa/component-tools'] = 'latest';
        await writeFileTree(`./${name}`, {
            'package.json': JSON.stringify(pkg, null, 2)
        })

        console.log();

        const url = `${gitAddress}/-/archive/master/${projectName}-master.zip`;
        const zip = await getZipFile(url);
        if (!zip){
            console.error('error !')
        }else{
            await Promise.all([
                copyFile(zip, 'o2.config.json', 'o2.config.json', name),
                copyFolder(zip, 'src', name),
                copyFolder(zip, 'public', name)
            ]);
            console.log();
            console.log(`${chalk.green('O2OA Comonent "'+name+'" Created!')}`);
        }
    }
}

export default componentFactory[options.framework] || function(){
    console.log(`${chalk.red('[ERROR] Does not support using '+options.framework+' to create O2OA Components')}`);
};
