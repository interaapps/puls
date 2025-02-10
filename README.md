# PULS

```bash
npm install pulsjs
```


```js
import { html, appendTo, state } from 'pulsjs'

const name = state('John')

appendTo(document.body, html`
    <h1>Hello ${name}!</h1>
    
    <input :bind=${name}>
`)
```