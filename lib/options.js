import path from 'path';
import fs from 'fs/promises';

const options = {
    framework: 'vue3',
    dependency: {
        branch: 'develop',
        components: [],
    },
    server: {
        host: '',
        port: ''
    },
    config: {
        sessionStorageEnable: true,
        footer: 'O2OA develop work',
        title: 'O2OA develop work'
    },
    git:{
        group: 'https://git.o2oa.net/o2oa/',
        templates: {
            vue3: 'component-template-vue3'
        }
    }
};

const configFileName = path.join(path.resolve(), 'o2.config.json');
let customOptions = {};
try {
    const configText = await fs.readFile(configFileName, 'utf8');
    customOptions = JSON.parse(configText);
}catch{}

export default Object.assign(options, customOptions);
