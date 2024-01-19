import fs from 'node:fs/promises';
import path from 'path';
import {init} from './oo-init.js';
import chalk from "chalk";
import {getGitUrl, getConfig, exists} from "./oo-libs.js";

export default async function (options) {
    let opts = {};
    try {
        const optionPath = path.resolve('', '.o2oa/.options');
        const existsOption = await exists(optionPath);
        const opt = existsOption ? await fs.readFile(optionPath) : await fs.readFile(path.resolve('', './.options'));
        Object.assign(opts, JSON.parse(opt));
    } catch (e) {}
    Object.assign(opts, options);
    opts.pull = true;

    const success = await init(opts);

    if (success){
        console.log('');
        console.log('');
        console.log(`  ✔️  ${chalk.greenBright('The O2OA component development environment is Pull Successfully!')}`);
        console.log('');
        console.log('');
    }
}
