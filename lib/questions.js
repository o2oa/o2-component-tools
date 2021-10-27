import inquirer from "inquirer";
import options from './options.js';
export const questions = {
    'framework': {
        'type': 'list',
        'name': 'protocol',
        'choices': Object.keys(options),
        'default': 'vue3',
        'message': 'Select Framework: '
    }
}

async function ask(question, options, o) {
    let q = Object.create(questions[question]);
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
