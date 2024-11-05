import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import {loadComponent} from '@o2oa/component';

loadComponent('<%= projectName %>', (d, cb)=>{
    createApp(App).mount(d);
    cb();
}).then((c)=>{
    c.render();
});
