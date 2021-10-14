import options from './options.js';
import fs from 'fs/promises';
//import shell from 'shelljs';
import vueCreate from '@vue/cli/lib/create.js';
import writeFileTree from '@vue/cli/lib/util/writeFileTree.js';
//require('../lib/create')

class componentFactory{
    static async vue3() {
        await vueCreate('test2', {});

        await fs.rm('test2/public/favicon.ico');

        const pkg = JSON.parse(await fs.readFile('./test2/package.json', {'encoding': 'utf8'}));
        pkg.devDependencies['@o2oa/component-tools'] = 'latest';
        await writeFileTree('./test2', {
            'package.json': JSON.stringify(pkg, null, 2)
        })

        console.log("vue3 app created");
        //shell.ls('*');
        //shell.exec('vue create test -p __default_vue_3__');
    }
}
export default function(){
    componentFactory[options.framework]();
}