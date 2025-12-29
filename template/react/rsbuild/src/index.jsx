import React from 'react'
import ReactDOM from 'react-dom/client'
import { loadComponent } from '@o2oa/component'
import App from './App'

loadComponent('<%= projectName %>', (content, cb) => {
  const root = ReactDOM.createRoot(content)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  cb()
}).then(c => {
  c.render()
})
