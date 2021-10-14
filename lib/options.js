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
        sessionStorageEabled: true,
        footer: 'O2OA develop work',
        title: 'O2OA develop work'
    }
};

const configFileName = path.join(path.resolve(), 'o2.config.json');
let customOptions = {};
try {
    const configText = await fs.readFile(configFileName, 'utf8');
    customOptions = JSON.parse(configText);
}catch{}

export default Object.assign(options, customOptions);