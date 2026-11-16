import { useState } from 'react'
import reactLogo from './assets/react.svg'
import logo from './assets/logo.svg'

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div className='grid-cols:2 w:fit mx:auto'>
        <a href="https://github.com/0Miles/StetCSS" target="_blank" rel="noreferrer">
          <img src={logo} className="logo brand scale(2)" alt="Logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className="font:heavy font:sans tracking:tight fg:white@dark">
        <span>StetCSS</span> <span className="fg:#00D8FF">React</span>
      </h1>
      <div className="card">
        <button className="h:10x bg:gray-80" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Click on the logos to learn more
      </p>
    </>
  )
}

export default App
