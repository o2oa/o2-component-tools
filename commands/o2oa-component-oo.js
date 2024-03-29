import Listr from "listr";
import chalk from "chalk";
import UpdaterRenderer from "listr-update-renderer";
import path from "node:path";
import {getConfig, getGitUrl, exists} from "./oo-libs.js";
import {$} from "execa";
import fs from 'node:fs/promises';
import {ask} from "../lib/questions.js";
import options from "../lib/options.js";

let packageManager = 'yarn';
let templates = {};
let libs = [];
async function setPackage(cwd, npmName) {
    const p = path.resolve(cwd, 'package.json');
    const packageText = await fs.readFile(p);
    const packageJson = JSON.parse(packageText);
    packageJson.name = npmName;

    libs.forEach((lib)=>{
        if (lib.dependencies==='dev'){
            packageJson.devDependencies[lib.npm] = `file:../.o2oa/${lib.name}`;
        }else{
            packageJson.dependencies[lib.npm] = `file:../.o2oa/${lib.name}`;
        }
    });

    await fs.writeFile(p, JSON.stringify(packageJson, null, '\t'));
}
function addLanguage(cwd, appName){
    const p = path.resolve(cwd, 'src/locales/language.js');
    return fs.writeFile(p, `
import {loadAppLp} from '@o2oa/common';

const lps = import.meta.glob('./*.json');
export default function(){
    return loadAppLp('${appName}', lps);
}`);
}
async function createTasks(url, cwd, npmName, appName, opts) {
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
                return Promise.all([
                    //修改 package.json, 修改项目名称，修改依赖
                    setPackage(cwd, npmName),
                    //添加语言包文件
                    addLanguage(cwd, appName)
                ]);
            }
        },
        {
            //安装npm依赖库
            title: `${chalk.bold(chalk.blueBright('Install package dependencies'))}`,
            task: async () => {
                // try{
                //     await $({shell: true, cwd})`yarn ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
                // }catch(e){
                    packageManager = 'npm';
                    await $({shell: true, cwd})`npm install ${!opts.npmjs ? '--registry https://registry.npmmirror.com' : ''}`;
                // }
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
    return exit(`  ❌  [ERROR] ${txt}`, `redBright`);
}

export default {
    async create(name, opts) {
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

        const config = await getConfig();
        templates = config.templates;
        libs = config.libs;

        try{
            const opt = await fs.readFile(path.resolve('', '.o2oa/.options'));
            opts = Object.assign(JSON.parse(opt), opts);
        }catch(e){}

        const qs = Object.keys(templates).map((k) => {
            return {
                value: k,
                name: k+ `${templates[k].description})`,
                description: templates[k].description
            }
        });

        if (!opts.framework) opts.framework = await ask('oo-framework', {choices: qs});
        const framework = opts.framework.toLowerCase();

        const tp = templates[framework];
        if (!tp){
            return err('The application template named '+opts.framework+' was not found');
        }

        // const lib = templates['oovm'];
        const gitUrl = getGitUrl(tp, (opts.protocol || 'https'), '/app-templates');

        if (!gitUrl) return err('Unable to obtain Git repository address!');

        console.log('');
        const task = await createTasks(gitUrl, cwd, npmName, appName, opts);
        await task.run();

        const host = await ask("o2serverHost");
        const port = await ask("o2serverWebPort");
        const https = await ask("isHttps");

        const json = {
            devServer: {host, port, https}
        }
        const configPath = path.resolve(cwd, 'o2.config.json');
        await fs.writeFile(configPath, JSON.stringify(json, null, '\t'));

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
