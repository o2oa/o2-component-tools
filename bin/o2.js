#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import fs from 'fs/promises';
import create from '../commands/create.js';
import oo_init from '../commands/oo-init.js';
import oo_upgrade from '../commands/oo-upgrade.js';
import oo_pull from '../commands/oo-pull.js';
import path from "node:path";

const program = new Command();

let pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), {'encoding': 'utf8'}));

program.version(pkg.version, '-v, --vers', 'output the current version');

program
    .command('create <app-name>' )
    .description('create a new O2OA component - v9')
    .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
    .option('-d, --default', 'Skip prompts and use default preset')
    .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
    .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
    .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
    .option('-g, --git [message]', 'Force git initialization with initial commit message')
    .option('-n, --no-git', 'Skip git initialization')
    .option('-f, --force', 'Overwrite target directory if it exists')
    .option('--merge', 'Merge target directory if it exists')
    .option('-c, --clone', 'Use git clone when fetching remote preset')
    .option('-x, --proxy <proxyUrl>', 'Use specified proxy when creating project')
    .option('-b, --bare', 'Scaffold project without beginner instructions')
    .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
    .option('-w, --framework', 'Which framework to use to create O2OA component')
    .action((name, opts) => {
        create(name, opts); });

program
    .command('new <app-name>' )
    .description('create a new O2OA component')
    .option('-w, --framework', 'Which framework to use to create O2OA component')
    .option('-p, --protocol', 'What protocol is used to clone git repository. https or ssh')
    .option('-n, --npmjs', 'Use official registry')
    .action((name, opts) => {
        opts.version='oo';
        create(name, opts);
    });

program
    .command('init' )
    .description('Initialize the O2OA front-end development environment')
    .option('-y, --confirm', 'Confirm to perform initialization operation')
    .option('-r, --reinstall', 'Reinstall all dependencies')
    .option('-n, --npmjs', 'Use official registry')
    .option('-p, --protocol', 'What protocol is used to clone git repository. https or ssh')
    .action((opts) => {
        oo_init(opts);
    });

program
    .command('upgrade' )
    .description('Upgrade O2OA front-end development environment')
    .option('-r, --reinstall', 'Reinstall all dependencies')
    .option('-p, --protocol', 'What protocol is used to clone git repository. https or ssh')
    .option('-n, --npmjs', 'Use official registry')
    .option('-y, --confirm', 'Confirm to perform initialization operation')
    .action((opts) => {
        opts.confirm = true;
        oo_upgrade(opts);
    });

program
    .command('pull' )
    .description('Pull O2OA front-end development environment')
    .option('-r, --reinstall', 'Reinstall all dependencies')
    .option('-p, --protocol', 'What protocol is used to clone git repository. https or ssh')
    .option('-n, --npmjs', 'Use official registry')
    .option('-y, --confirm', 'Confirm to perform initialization operation')
    .action(async (opts) => {
        opts.confirm = true;
        oo_pull(opts);
    });

program
    .command('dev' )
    .description('Quickly clone projects and build a development environment')
    .option('-y, --confirm', 'Confirm to perform initialization operation')
    .option('-r, --reinstall', 'Reinstall all dependencies')
    .option('-n, --npmjs', 'Use official registry')
    .option('-p, --protocol', 'What protocol is used to clone git repository. https or ssh')
    .action((opts) => {
        opts.target = '.';
        oo_init(opts);
    });
program.parse(process.argv);
