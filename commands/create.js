import options from '../lib/options.js';
import {ask} from '../lib/questions.js'
import vueCreate from '@vue/cli/lib/create.js';
import chalk from 'chalk';
import path from 'path';
import { URL } from 'url';
import sh from 'child_process';
import utils from '@vue/cli-shared-utils';
import f from 'fs';
const fs = f.promises;
const {hasYarn, hasPnpm3OrLater} = utils;

//import PackageManager from '@vue/cli/lib/util/ProjectPackageManager.js'
import { executeCommand } from '@vue/cli/lib/util/executeCommand.js'

const packageManager = (
    (hasYarn() ? 'yarn' : null) ||
    (hasPnpm3OrLater() ? 'pnpm' : 'npm')
);

const __dirname = (() => {let x = path.dirname(decodeURI(new URL(import.meta.url).pathname)); return path.resolve( (process.platform == "win32") ? x.substr(1) : x ); })();

class componentFactory{
    static async vue3(name, opts) {
        const componentPath = 'x_component_'+name.replace(/\./g, '_');

        let o = (opts || {});
        const p = path.resolve(__dirname, options.vue3);
        o.preset = p;
        o.skipGetStarted = true;
        await vueCreate(componentPath, o);
        await componentFactory.writeGulpAppFile(componentPath);

        console.log();
        console.log(`👉  `+`${chalk.green('O2OA Comonent "'+componentPath+'" Created!')}`);
        console.log();
        console.log(
            `👉  Get started with the following commands:\n\n` +
            chalk.cyan(` ${chalk.gray('$')} cd ${componentPath}\n`) +
            chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : packageManager === 'pnpm' ? 'pnpm run serve' : 'npm run serve'}`)
        );
    }
    static async react(name, opts) {
        const componentPath = 'x_component_'+name.replace(/\./g, '_');
        const templatePath = path.resolve(__dirname, options["react"]);

        try{
            await executeCommand('npx', ['create-react-app', componentPath, '--scripts-version', '@o2oa/react-scripts']);

            console.log();
            console.log(`👉  `+`Generate O2OA component ... `);
            console.log();

            const pkgStr = await fs.readFile(path.resolve(componentPath, 'package.json'), 'utf8');
            const pkg = JSON.parse(pkgStr);
            pkg.scripts['o2-deploy'] = 'react-scripts build';
            await executeCommand(packageManager, ['install', '@o2oa/component'], componentPath);

            console.log();
            console.log(`👉  `+`Configure O2OA development server ... `);
            console.log();

            const host = await ask("o2serverHost");
            const port = await ask("o2serverCenterPort");
            const webPort = await ask("o2serverWebPort");
            const isHttps = await ask("isHttps");

            console.log(host);
            await componentFactory.cpfile(componentPath, templatePath, {
                projectName: name,
                projectPath: componentPath,
                o2serverHost: host,
                o2serverCenterPort: port,
                o2serverWebPort: webPort,
                isHttps: isHttps
            });

            await componentFactory.writeGulpAppFile(componentPath);

            console.log();
            console.log(`👉  `+`${chalk.green('O2OA Comonent "'+componentPath+'" Created!')}`);

        }catch(e){
            throw e;
        }


        // const subprocess = sh.spawn('npm.cmd', ['install'], {
        //     stdio: ['inherit', 'inherit', 'inherit']
        // });
        // subprocess.on('close', (code) => {
        //     console.log(`child process close all stdio with code ${code}`);
        // });
    }
    static async o2_native(name, opts) {
        const componentPath = 'x_component_'+name.replace(/\./g, '_');
        const templatePath = path.resolve(__dirname, options["o2_native"]);

        if (f.existsSync(componentPath)){
            console.log();
            console.log(`👉  `+`${chalk.red('Can not Create Component "'+name+'", file already exists "'+componentPath+'" !')}`);

            return '';
        }

        await fs.mkdir(componentPath);
        await componentFactory.cpfile(componentPath, templatePath, {
            projectName: name,
            projectPath: componentPath
        });

        await componentFactory.writeGulpAppFile(componentPath, '["move", "min"]');

        console.log();
        console.log(`👉  `+`${chalk.green('O2OA Comonent "'+componentPath+'" Created!')}`);
    }
    static async cpfile(cPath, tpPath, opts){
        const files = await fs.readdir(tpPath);
        for (const file of files){
            let p = path.resolve(tpPath, file);
            let stats = await fs.stat(p);
            if (stats.isFile()){
                let content;
                const ext = path.extname(p).toLowerCase();
                if (ext==='.js' || ext==='.html' || ext==='.css'){
                    content = await fs.readFile(p, 'utf8');
                    Object.keys(opts).forEach((k)=>{
                        const reg = new RegExp('\<\%= '+k+' \%\>', 'g');
                        content = content.replace(reg, opts[k]);
                    });

                }else{
                    content = await fs.readFile(p);
                }
                await fs.writeFile(path.resolve(cPath, file), content);
            }
            if (stats.isDirectory()){
                let cp = path.resolve(cPath, file)
                await fs.mkdir(cp, {recursive: true})
                await componentFactory.cpfile(cp, p, opts)
            }
        }
    }
    static async writeGulpAppFile(componentPath, tasks) {
        try {
            const appContent = await fs.readFile('../gulpapps.js', 'utf8');
            const reg = RegExp('\\"folder.*\\"'+componentPath+'\\"');
            if (!reg.test(appContent)){
                const thisComponentText = `{ "folder": "${componentPath}", "tasks": ${tasks || "[]"} }\n`;
                const regexp = RegExp('(var\\s*apps\\s*=\\s*\\[)([\\s]*)({?[\\s\\S]*}?)([\\s\\S]*\\][\\s\\S]*)(module.exports.*)','g');

                const matches = [...[...appContent.matchAll(regexp)][0]];
                matches.shift();
                let updateAppContent = '';
                matches.forEach((match, i)=>{
                    if (i===2){
                        const t = match.trim();
                        updateAppContent += t+((t) ? ',\n    '+thisComponentText : thisComponentText);
                    }else{
                        updateAppContent += match
                    }
                });

                await fs.writeFile('../gulpapps.js', updateAppContent);
            }
        }catch{}
    }
}

export default async function (name, opts) {
    if (!opts.framework) opts.framework = await ask("framework");
    const framework = opts.framework.toLowerCase();

    if (componentFactory[framework]) {
        componentFactory[framework](name, opts);
    } else {
        console.log(`${chalk.red('[ERROR] Does not support using ' + options.framework + ' to create O2OA Components')}`);
    }
}
