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


# Extensions
## SCSS
```bash
npm install pulsjs-scss
```
```js
import { PulsComponent, html } from 'pulsjs'
import { scss } from 'pulsjs-scss'

export class ExampleComponent extends PulsComponent {
    render() {
        return html`
            example
        `
    }
    
    styles() {
        return scss`
            example {
                color: red;
            }
        `
    }
}
```