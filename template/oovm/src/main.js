import {loadComponent} from '@o2oa/component';
import index from './app/index';

loadComponent('<%= projectName %>', (d, cb)=>{
    debugger;
    index.render(d).then(()=>{
        cb();
    });
}).then((c)=>{
    debugger;
    c.render();
});
