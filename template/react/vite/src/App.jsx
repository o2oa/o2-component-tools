import { useState, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import o2logo from './assets/o2oa.svg';
import './App.css'
import {lp} from '@o2oa/component'
import O2Task from "./components/O2Task.jsx";

function App() {
    const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://www.o2oa.net" target="_blank">
          <img src={o2logo} className="logo" alt="O2OA logo" />
        </a>
      </div>
      <h1>Vite + React + O2OA</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p>
        {lp.welcome}
      </p>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
        <O2Task />
    </>
  )
}

export default App
