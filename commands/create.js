import options from '../lib/options.js';
import {ask} from '../lib/questions.js'
import vueCreate from '@vue/cli/lib/create.js';
import chalk from 'chalk';
import path from 'path';
import { URL } from 'url';
import utils from '@vue/cli-shared-utils';
import fs from 'fs/promises';
const {hasYarn, hasPnpm3OrLater} = utils;
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

        console.log();
        console.log(`👉  `+`${chalk.green('O2OA Comonent "'+componentPath+'" Created!')}`);
        console.log();
        console.log(
            `👉  Get started with the following commands:\n\n` +
            chalk.cyan(` ${chalk.gray('$')} cd ${componentPath}\n`) +
            chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : packageManager === 'pnpm' ? 'pnpm run serve' : 'npm run serve'}`)
        );
    }
    static async o2_native(name, opts) {
        const componentPath = 'x_component_'+name.replace(/\./g, '_');
        const templatePath = path.resolve(__dirname, options["o2_native"]);

        await fs.mkdir(componentPath, {recursive: true});

        const cpfile = async function(cPath, tpPath){
            const files = await fs.readdir(tpPath);
            for (const file of files){
                let p = path.resolve(tpPath, file);
                let stats = await fs.stat(p);
                if (stats.isFile()){
                    let content = await fs.readFile(p);
                    await fs.writeFile(path.resolve(cPath, file), content);
                }
                if (stats.isDirectory()){
                    let cp = path.resolve(cPath, file)
                    await fs.mkdir(cp, {recursive: true})
                    await cpfile(cp, p)
                }
            }
        }
        await cpfile(componentPath, templatePath);

        console.log();
        console.log(`👉  `+`${chalk.green('O2OA Comonent "'+componentPath+'" Created!')}`);
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
