import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import pulsLogo from './puls.svg'
import { Counter } from './Counter.js'
import { appendTo, html } from 'pulsjs'

appendTo(document.getElementById('app'), html`
    <div>
        <a href="https://vite.dev" target="_blank">
            <img src=${viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://github.com/interaapps/puls" target="_blank">
            <img src=${pulsLogo} class="logo puls" alt="Puls logo" />
        </a>

        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
            <img src=${javascriptLogo} class="logo vanilla" alt="JavaScript logo" />
        </a>
        <h1>Vite + Puls + JavaScript</h1>
        <div class="card">
            <${Counter} />
        </div>
        <p class="read-the-docs">
            Click on the Vite, Puls and JavaScript logos to learn more
        </p>
    </div>
`)

