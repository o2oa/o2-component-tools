import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import { loadComponent } from '@o2oa/component'

loadComponent('<%= projectName %>', (content, cb) => {
  createApp(App).mount(content)
  cb()
}).then(c => {
  c.render()
})
