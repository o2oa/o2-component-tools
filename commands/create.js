import options from '../lib/options.js';
import {ask} from '../lib/questions.js'
import chalk from 'chalk';

async function create(name, pkg, q, opts) {
    const componentFactory = (await import(`./o2oa-component-${pkg}.js`)).default;

    if (pkg==='x'){
        if (!opts.framework) opts.framework = await ask(q);
        const framework = opts.framework.toLowerCase();
        if (componentFactory[framework]) {
            componentFactory[framework](name, opts);
        } else {
            console.log(`${chalk.red('[ERROR] Does not support using ' + opts.framework + ' to create O2OA Components')}`);
        }
    }else{
        componentFactory['create'](name, opts);
    }
}

export default async function (name, opts) {
    if (name.includes("_") || name.includes("-") || name.includes("$") || name.includes("#") || name.includes("@")){
        console.log(`${chalk.red('[ERROR] The name cannot contain symbols such as "_", "-", "$", "#", "@", etc.')}`);
    }else{
        // const version = opts.version || (await ask("version"));
        const version = opts.version;
        if (version==='oo'){
            await create(name, 'oo', 'oo-framework', opts);
        }else{
            await create(name, 'x', 'framework', opts);
        }
    }
}
