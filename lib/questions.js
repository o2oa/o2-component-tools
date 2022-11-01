import inquirer from "inquirer";
import options from './options.js';
export const questions = {
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
    }
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
