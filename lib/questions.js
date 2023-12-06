import inquirer from "inquirer";
import options from './options.js';
export const questions = {
    'version': {
        'type': 'list',
        'name': 'version',
        'choices': [
            {
                name: 'O2OA < 10 : ( If you want to develop components below O2OA-v10, please select this option )',
                value: 'x',
                description: 'npm is the most popular package manager',
            },
            {
                name: 'O2OA >= 10 : ( If you want to develop components for O2OA-v10 or above, please select this option )',
                value: 'oo',
                description: 'npm11 is the most popular package manager',
            },
        ],
        'default': 'oo',
        'message': 'Select O2OA Version: '
    },
    'framework': {
        'type': 'list',
        'name': 'protocol',
        'choices': Object.keys(options),
        'default': 'o2_native',
        'message': 'Select Framework: '
    },
    'o2serverHost': {
        type: 'input',
        name: 'o2serverHost',
        message: 'Input o2 server hosts',
        default: ''
    },
    'o2serverCenterPort': {
        type: 'input',
        name: 'o2serverCenterPort',
        message: 'Input o2 center server port',
        default: '80'
    },
    'o2serverWebPort': {
        type: 'input',
        name: 'o2serverWebPort',
        message: 'Input o2 web server port',
        default: '80'
    },
    'isHttps': {
        type: 'confirm',
        name: 'isHttps',
        message: 'Is o2 server Use https',
        default: false
    },

    'oo-init-confirm': {
        type: 'confirm',
        name: 'initConfirm',
        message: 'This operation will initialize the O2OA front-end development environment, which you\'d better run in an empty folder. Confirm?',
        default: true
    },
    'oo-init-protocol': {
        type: 'list',
        name: 'initProtocol',
        choices: ['https', 'ssh'],
        message: 'Choose git cloning protocol:',
        default: 'https'
    },
    'oo-init-overwrite': {
        type: 'confirm',
        name: 'initOverwrite',
        message: '{{folder}} already exists, do you want to overwrite it?',
        default: true
    },

    'oo-framework': {
        'type': 'list',
        'name': 'protocol',
        'choices': ['oovm'],
        'default': 'oovm',
        'message': 'Select Framework: '
    },

}

async function ask(question, options, o) {
    const ques = questions[question];
    let q = {};
    Object.keys(ques).forEach((k)=>{
        q[k] = ques[k]
    });
    //let q = Object.create(questions[question]);
    if (options) q = Object.assign(q, options);
    if (o){
        Object.keys(o).forEach((k)=>{
            q.message = q.message.replace('{{'+k+'}}', o[k]);
        });
    }
    let answers = await inquirer.prompt([q]);
    return answers[q.name];
}
export {ask}
