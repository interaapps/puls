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


## State
```js
import { state, computed, html, appendTo } from 'pulsjs'

const name = state('John')

const computedValue = computed(() => `I'm happy that you are named ${name.value}`)

appendTo(document.body, html`
    <h1>Hello ${name}!</h1>
    
    ${computedValue}
    
    <input :bind=${name}>
`)
```

## Components
### Functions
```js
import { html } from 'pulsjs'

function ExampleComponent(props) {
    return html`
        <p>Example component</p>
    `
}

html`
    <${ExampleComponent} />
`
```
### Class components
```js
import { html } from 'pulsjs'

class ExampleComponent extends PulsComponent {
    setup() {
        console.log('Setup')
    }
    
    render() {
        return html`
            <p>Example component</p>
        `
    }
}

html`
    <${ExampleComponent} />
`
```


## Extensions
### SCSS
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



## Contributing
Use pnpm

### Build
```bash
pnpm run build
```

### Test
```bash
pnpm test
```