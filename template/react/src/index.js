import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {loadComponent} from '@o2oa/component';

loadComponent('<%= projectName %>', (content, cb)=>{
    ReactDOM.render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>,
        content,
        cb
    );
}).then((c)=>{
    c.render();
});


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
