import fs from "node:fs/promises";

const git = {
    group: 'o2oa-pro',
    server: 'git.o2oa.net',
    sshPort: '2020',
    httpsPort: ''
}
const libs = [
    {
        name: 'o2oa-web',
        npm: '@o2oa/web',
        description: 'O2OA前端主应用'
        //ssh: ssh://git@git.o2oa.net:2020/o2oa-pro/o2oa-web.git
        //ssh: https://git.o2oa.net/o2oa-pro/o2oa-web.git
    },
    {
        name: 'o2oa-common',
        npm: '@o2oa/common',
        description: 'O2OA前端通用设计'
    },
    {
        name: 'o2oa-ui',
        npm: '@o2oa/ui',
        description: 'O2OA UI设计组件。（此设计不依赖O2OA，可以在任何项目中，与组织相关的组件除外）'
    },
    {
        name: 'o2oa-oovm',
        npm: '@o2oa/oovm',
        description: 'O2OA前端组件框架。（此设计不依赖O2OA，可以在任何项目中）'
    },
    {
        name: 'o2oa-action',
        npm: '@o2oa/action',
        description: '提供与O2OA服务器进行restful交互的工具库。可以在任何其他项目中使用，提供相关服务器和认证信息即可实现与O2OA后端服务的交互'
    },
    {
        name: 'o2oa-util',
        npm: '@o2oa/util',
        description: '通用工具库。（此设计不依赖O2OA，可以在任何项目中）'
    }
]
const templates = {
    oovm: {
        name: 'app-empty',
        npm: '@o2oa/app-empty',
        description: '使用oovm框架的O2OA前端组件模板'
    },
    vue: {
        name: 'app-vue-empty',
        npm: '@o2oa/app-vue-empty',
        description: '使用vue3框架的O2OA前端组件模板。不再提供vue2版本。'
    }
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


export {git, libs, templates, getGitUrl, exists};
