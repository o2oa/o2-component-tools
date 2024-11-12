import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {loadComponent} from '@o2oa/component';

loadComponent('<%= projectName %>', (content, cb)=>{
    createRoot(content).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
    cb();
}).then((c)=>{
    c.render();
});


