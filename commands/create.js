import options from '../lib/options.js';
import {ask} from '../lib/questions.js'
import vueCreate from '@vue/cli/lib/create.js';
import chalk from 'chalk';

class componentFactory{
    static async vue3(name, opts) {
        let o = (opts || {});
        o.preset = options.vue3;
        o.skipGetStarted = true;
        await vueCreate(name, o);

        console.log();
        console.log(`👉  `+`${chalk.green('O2OA Comonent "'+name+'" Created!')}`);
        console.log();
        console.log(
            `👉  Get started with the following commands:\n\n` +
            chalk.cyan(` ${chalk.gray('$')} cd ${componentPath}\n`) +
            chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : packageManager === 'pnpm' ? 'pnpm run serve' : 'npm run serve'}`)
        );
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
