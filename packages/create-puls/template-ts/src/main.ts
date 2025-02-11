import './style.css'
import typescriptLogo from './typescript.svg'
import pulsLogo from './puls.svg'
import viteLogo from '/vite.svg'
import {appendTo, html} from "pulsjs";
import {Counter} from "./Counter";

appendTo(document.getElementById('app')!, html`
    <div>
        <a href="https://vite.dev" target="_blank">
            <img src=${viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://github.com/interaapps/puls" target="_blank">
            <img src=${pulsLogo} class="logo puls" alt="Puls logo" />
        </a>
        <a href="https://www.typescriptlang.org/" target="_blank">
            <img src=${typescriptLogo} class="logo vanilla" alt="TypeScript logo" />
        </a>
        <h1>Vite + Puls + TypeScript</h1>
        <div class="card">
            <${Counter} />
        </div>
        <p class="read-the-docs">
            Click on the Vite, Puls and TypeScript logos to learn more
        </p>
    </div>
`)
