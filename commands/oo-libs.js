import fs from "node:fs/promises";
import got from 'got';
import path from "node:path";
import {URL} from "url";

const git = {
    group: 'o2oa-pro',
    server: 'git.o2oa.net',
    sshPort: '2020',
    httpsPort: '',
    configLib: {
        name: 'dev-config'
    }
}

async function loadConfigFiles(paths) {
    for (const p of paths) {
        const filePath = path.resolve(process.cwd(), p);
        const fileExists = await exists(p);
        if (fileExists){
            return (await import(filePath)).default;
        }
    }
    return {};
}
async function getConfig() {
    const filenames = ['o2oa.config.js', 'o2oa.config.json', 'o2oa.config.mjs'];
    const localConfig = await loadConfigFiles(filenames);

    const url = getGitUrl(git.configLib).slice(0, -4);

    console.log(`${url}/-/raw/master/config.json?inline=false`);

    const remoteConfig = await got(`${url}/-/raw/master/config.json?inline=false`).json();
    return Object.assign(remoteConfig, localConfig);
}

function getGitUrl(lib, protocol){
    if (protocol==='ssh'){
        return `ssh://git@${git.server}${(git.sshPort) ? ':'+git.sshPort : ''}/${git.group}/${lib.name}.git`
    }else{
        return `https://${git.server}${(git.httpsPort) ? ':'+git.httpsPort : ''}/${git.group}/${lib.name}.git`
    }
}
function exists(path) {
    return new Promise((resolve) => {
        fs.access(path, fs.constants.R_OK | fs.constants.W_OK).then(()=>{
            resolve(true);
        }, ()=>{
            resolve(false);
        })
    });
}


export {git, getConfig, getGitUrl, exists};
