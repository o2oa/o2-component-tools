import path from 'path';
import fs from 'fs/promises';

const options = {
    framework: 'vue3',
    dependency: {
        git: "https://git.o2oa.net/o2oa/o2oa/",
        branch: 'develop',
        components: [],
        core: ['o2_core', 'x_desktop']
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
    template:{
        git: 'https://git.o2oa.net/o2oa/',
        project: {
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
