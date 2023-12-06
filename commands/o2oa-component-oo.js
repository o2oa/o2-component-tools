import Listr from "listr";
import chalk from "chalk";
import UpdaterRenderer from "listr-update-renderer";
import path from "node:path";
import {templates, getGitUrl, exists} from "./oo-libs.js";
import {$} from "execa";
import fs from 'node:fs/promises';
import {ask} from "../lib/questions.js";

let packageManager = 'yarn';
async function setPackage(cwd, npmName) {
    const p = path.resolve(cwd, 'package.json');
    const packageText = await fs.readFile(p);
    const packageJson = JSON.parse(packageText);
    packageJson.name = npmName;
    packageJson.dependencies['@o2oa/action'] = 'file:../.o2oa/o2oa-action';
    packageJson.dependencies['@o2oa/common'] = 'file:../.o2oa/o2oa-common';
    packageJson.dependencies['@o2oa/oovm'] = 'file:../.o2oa/o2oa-oovm';
    packageJson.dependencies['@o2oa/util'] = 'file:../.o2oa/o2oa-util';
    packageJson.dependencies['@o2oa/ui'] = 'file:../.o2oa/o2oa-ui';

    await fs.writeFile(p, JSON.stringify(packageJson, null, '\t'));
}
async function createTasks(url, cwd, npmName, opts) {
    //创建组件任务
    return new Listr([
        {
            //首先通过git，获取模板库
            title: `${chalk.bold(chalk.blueBright('Get App Template from Gitlab'))}`,
            // task: () => $({shell: true})`git clone ${url} ${cwd}`
            task: async () => {
                //如果项目目录不存在，则创建
                if (!(await exists(cwd))) {
                    await fs.mkdir(cwd, {recursive: true})
                }

                //如果不存在.git目录，执行git.init
                if (!(await exists(path.resolve(cwd, '.git')))) {
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

                await $({shell: true, cwd})`git remote remove origin`;
            }
        },
        {
            //修改当前项目依赖
            title: `${chalk.bold(chalk.blueBright('Check package dependencies'))}`,
            task: () => {
                //修改 package.json, 修改项目名称，修改依赖
                return setPackage(cwd, npmName);
            }
        },
        {
            //安装npm依赖库
            title: `${chalk.bold(chalk.blueBright('Install package dependencies'))}`,
            task: async () => {
                try{
                    await $({shell: true, cwd})`yarn ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
                }catch(e){
                    packageManager = 'npm';
                    await $({shell: true, cwd})`npm install ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
                }
            }
        }
    ], {
        collapse: false,
        renderer: UpdaterRenderer
    });
}

function exit(log, color){
    console.log('');
    console.log(`${chalk[color](log)}`);
    console.log('');
    return false;
}
function cancel(){
    return exit(`  🛑  Processing Development Environment is Canceled!`, `yellowBright`);
}
function err(txt){
    return exit(`  ❌  ${txt}`, `redBright`);
}

export default {
    async oovm(name, opts) {
        const appName = name.startsWith('app-') ? name : 'app-' + name;
        const npmName = '@o2oa/' + appName;
        const cwd = path.resolve('', appName);

        const existsApp = await exists(cwd);
        if (existsApp){
            const overwrite = await ask("oo-init-overwrite", null, {folder: cwd});
            if (!overwrite) return cancel();

            const stat = await fs.stat(cwd);
            if (!stat.isDirectory()) {
                try {
                    await fs.rm(cwd, {force: true});
                } catch (err) {
                    console.error(err);
                    return false;
                }
            }
        }

        const lib = templates['oovm'];
        const gitUrl = getGitUrl(lib, (opts.protocol || 'https'));

        if (!gitUrl) return err('Unable to obtain Git repository address!');

        console.log('');
        const task = await createTasks(gitUrl, cwd, npmName, opts);
        await task.run();

        console.log('');
        console.log('');
        console.log(`  ✔️  ${chalk.greenBright('The O2OA component '+chalk.cyanBright(appName)+' created successfully!')}`);
        console.log('');
        console.log(
            `  👉  Get started with the following commands:\n\n` +
            chalk.cyan(`        ${chalk.gray('$')} cd ${appName}\n`) +
            chalk.cyan(`        ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn dev' : packageManager === 'pnpm' ? 'pnpm run dev' : 'npm run dev'}`)
        );
        console.log('');
        console.log('');
    }
};
