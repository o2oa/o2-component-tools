import fs from 'node:fs/promises';
import path from 'path';
import {init} from './oo-init.js';
import chalk from "chalk";
export default async function (options) {
    let opts = {};
    try{
        const opt = await fs.readFile(path.resolve('', '.o2oa/.options'));
        opts = JSON.parse(opt);
    }catch(e){}

    Object.assign(opts, options);

    const success = await init(opts);

    if (success){
        console.log('');
        console.log('');
        console.log(`  ✔️  ${chalk.greenBright('The O2OA component development environment is Upgraded successfully!')}`);
        console.log('');
        console.log('');
    }
}
