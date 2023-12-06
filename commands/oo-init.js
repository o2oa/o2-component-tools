import {getGitUrl, libs, exists} from "./oo-libs.js";
import fs from 'node:fs/promises';
import {ask} from "../lib/questions.js";
import path from "node:path";
import chalk from "chalk";
import Listr from 'listr';
import {$} from 'execa';
import UpdaterRenderer from 'listr-update-renderer';

const opts = {};

function exitInit(log, color){
    console.log('');
    console.log(`${chalk[color](log)}`);
    console.log('');
    return false;
}
function cancel(){
    return exitInit(`  🛑  Processing Development Environment is Canceled!`, `yellowBright`);
}

async function cloneLib(lib) {
    const cwd = path.resolve('', `.o2oa/${lib.name}`);
    const url = getGitUrl(lib, opts.protocol);

    const existsDir = await exists(cwd);
    if (existsDir){ //如果项目目录已经存在
        // //如果不存在.git目录，执行git.init
        // const gitInit = {
        //     title: 'Git Init',
        //     skip: () => exists(path.resolve('', `.o2oa/${lib.name}`, '.git')),
        //     task: () => $({shell: true, cwd})`git init`
        // }
        //
        // //获取origin，如果已有则remove
        // const addRemote = {
        //     title: 'Git Remote',
        //     task: async () => {
        //         const {stdout} = await $({shell: true, cwd})`git remote`;
        //         const origin = stdout.trim();
        //         if (origin) {
        //             await $({shell: true, cwd})`git remote remove ${origin}`;
        //         }
        //         await $({shell: true, cwd})`git remote add origin ${url}`;
        //     }
        // }
        //
        // //拉取
        // const fetch = {
        //     title: 'Git Fetch',
        //     task: () => $({shell: true, cwd})`git fetch --all`
        // }
        // const reset = {
        //     title: 'Git Reset',
        //     task: () => $({shell: true, cwd})`git reset --hard origin/master`
        // }

        return {
            title: `${chalk.gray('Check packages:')} ${(lib.name)}`,
            // task: () => new Listr([gitInit, addRemote, fetch, reset])
            task: async () => {
                //如果不存在.git目录，执行git.init
                if (!(await exists(path.resolve('', `.o2oa/${lib.name}`, '.git')))) {
                    await $({shell: true, cwd})`git init`;
                }

                //获取origin，如果已有则remove
                const {stdout} = await $({shell: true, cwd})`git remote`;
                const origin = stdout.trim();
                if (origin) {
                    await $({shell: true, cwd})`git remote remove ${origin}`;
                }
                //添加origin
                await $({shell: true, cwd})`git remote add origin ${url}`;
                //拉取
                await $({shell: true, cwd})`git fetch --all`;
                await $({shell: true, cwd})`git reset --hard origin/master`;
            }
        }
    }else{
        //如果不存在，直接克隆
        return {
            title: `${chalk.gray('Clone packages:')} ${(lib.name)}`,
            task: () => $({shell: true})`git clone ${url} ${cwd}`
        }
    }
}

async function createGitTasks() {
    return await Promise.all(libs.map(async (lib) => {
        return await cloneLib(lib)
    }));
}

function installPackage(lib){
    const cwd = path.resolve('', `.o2oa/${lib.name}`);
    return {
        title: `${chalk.gray('Install package dependencies:')} ${(lib.name)}`,
        // task: () => new Listr([gitInit, addRemote, fetch, reset])
        task: async () => {
            //先删除 package-lock.json 和 yarn.lock
            await fs.rm(path.resolve(cwd, 'package-lock.json'), {force: true});
            await fs.rm(path.resolve(cwd, 'yarn.lock'), {force: true});

            //删除 node_modules (是否一定要删除？)
            if (opts.reinstall){
                await fs.rm(path.resolve(cwd, 'node_modules'), {recursive:true, force: true});
            }
            // await fs.rm(path.resolve(cwd, 'package-lock.json'), {force: true});

            //运行yarn 或 npm
            try{
                await $({shell: true, cwd})`yarn ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
            }catch(e){
                await $({shell: true, cwd})`npm install ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
            }
        }
    }
}
async function createInstallTasks() {
    return await Promise.all(libs.map(async (lib) => {
        return await installPackage(lib)
    }));
}
async function createInitTasks() {
    //初始化任务
    return new Listr([
        {
            //首先通过git，获取最新的开发环境依赖库
            title: `${chalk.bold(chalk.blueBright('Get Packages From Gitlab'))}`,
            task: async () => {
                const ts = await createGitTasks();
                return new Listr(ts, {concurrent: true});
            }
        },
        {
            //安装npm依赖库
            title: `${chalk.bold(chalk.blueBright('Install package dependencies'))}`,
            task: async () => {
                const ts = await createInstallTasks();
                return new Listr(ts, {concurrent: true});
            }
        }
    ], {
        collapse: false,
        renderer: UpdaterRenderer
    });
}

async function checkDir() {
    //将需要依赖的项目clone到.o2oa目录下
    const o2oaDir = path.resolve('', '.o2oa');

    const existsO2oaDir = await exists(o2oaDir);
    if (existsO2oaDir) {
        const overwrite = opts.confirm || (await ask("oo-init-overwrite", null, {folder: o2oaDir}));
        //如果o2oa目录已经存在，而不选择覆盖，则取消初始化
        if (!overwrite) return cancel();

        const stat = await fs.stat(o2oaDir);
        if (!stat.isDirectory()) {
            try {
                await fs.rm(o2oaDir, {force: true});
                await fs.mkdir(o2oaDir, {recursive: true});
            } catch (err) {
                console.error(err);
                return false;
            }
        }
    } else {
        try {
            await fs.mkdir(o2oaDir, {recursive: true});
        } catch (err) {
            console.error(err);
            return false;
        }
    }
    return true;
}
export async function init(options) {
    try{
        const {stdout} = await $({shell: true})`node -v`;
        const v = stdout.trim().substring(1).split('.');
        if (parseInt(v[0])<16){
            console.log('');
            console.log(`    ${chalk.redBright('The current Node.js version is too low and requires v16 or above. ('+stdout+')')} `);
            return cancel();
        }
    }catch(e){
        console.error(e);
        return cancel();
    }


    Object.assign(opts, options);
    opts.intConfirm = opts.confirm || (await ask("oo-init-confirm"));
    //如果不确认，则取消初始化
    if (!opts.intConfirm) return cancel();

    //检查开发环境目录
    const checked = await checkDir();
    if (!checked) return cancel();

    //选择clone仓库协议
    opts.protocol = opts.protocol || (await ask("oo-init-protocol"));

    //将 opts 记录下来
    const opt = JSON.stringify(opts, null, '\t');
    await fs.writeFile(path.resolve('', '.o2oa/.options'), opt);

    //创建初始化任务
    console.log('');
    const task = await createInitTasks();
    await task.run();

    return true;
}
export default async function (options) {
    const success = await init(options);

    if (success){
        console.log('');
        console.log('');
        console.log(`  ✔️  ${chalk.greenBright('The O2OA component development environment is initialized successfully!')}`);
        console.log('');
        console.log(`  👉  You can create components through the following command:`);
        console.log(`        ${chalk.gray('$')} ${chalk.cyan('o2-cmpt new <your-app-name>')}`);
        console.log('');
        console.log(`  👉  You can upgrade the development environment with the following command:`);
        console.log(`        ${chalk.gray('$')} ${chalk.cyan('o2-cmpt upgrade')}`);
        console.log('');
        console.log('');
    }
}
