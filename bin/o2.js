#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import fs from 'fs/promises';
// import {cmd_addServer, cmd_delServer} from './commands/env.js'
// import {cmd_getApplication} from './commands/application.js'
const program = new Command();

let pkg = JSON.parse(await fs.readFile('./package.json', {'encoding': 'utf8'}));
program.version(pkg.version, '-v, --vers', 'output the current version')
    .command('create' )
    // .argument('<name>', 'Provide a name for the server configuration')
    .description('Create a O2OA component')
    .option('-n --name <value>', 'O2OA component name')
    .action((opts) => { cmd_addServer(opts); });

program .command('serve')
    .description('Start dev server')
    .action(() => { cmd_delServer(name); });

program.command('build')
    .description('Get Application from server')
    .action((opts) => { cmd_getApplication(opts); });

program.parse(process.argv);

// const options = program.opts();
// console.log(options);
//console.log('Welcome to O2OA developer Cli v'+ pkg.version);
