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

## Feature overview
- Puls uses the DOM directly (no virtual DOM)
- Reactive state
- Computed values
- Components
- Control flow
- Event handling
- Bindings

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

function ExampleComponent({
    example
}) {
    return html`
        <p>Example component ${example}</p>
    `
}

html`
    <${ExampleComponent} example="hello world" />
`
```
### Class components
```js
import { html } from 'pulsjs'

class ExampleComponent extends PulsComponent {
    example = state('val')
    
    setup() {
        console.log('Setup')
    }
    
    render() {
        return html`
            <p>Example component ${this.example}</p>
        `
    }
}
registerComponent('exmaple-component', ExampleComponent)

// Typescript
@CustomElement('example-component')
export class ExampleComponent extends PulsComponent {}

const a = state('test')
html`
    <${ExampleComponent} example=${a} />
`
```

### Using Web-Components outside of Puls
```js
export class ExampleComponent extends PulsComponent {
    test = state('hello')
    exampleObject = state({})
    // ...
}
registerComponent('example-component', ExampleComponent)

document.body.innerHTML = `
    <example-component test="hello"></example-component>
    
    <example-component :exampleObject="{\"key\": 4}"></example-component>
`
```

# Control flow
```js
import { html, appendTo, state, computed } from 'pulsjs'

const counter = state(1)

html`
    <!-- js ternary operator -->
    ${computed(() => 
        counter.value === 1 ? html`<div>Value is 1</div>` :
        counter.value === 2 ? html`<div>Value is 2</div>` :
        html`Value is something else`
    )}
    
    <!-- attributes -->
    <div :if=${() => counter.value === 1}>
        Value is 1
    </div>
    <div :else-if=${() => counter.value === 1}>
        Value is 2
    </div>
    <div :else>
        Value is something else
    </div>
    
    <button @click=${() => counter.value++}>Increment ${counter}</button>
`
```



## Extensions
### SCSS
```bash
npm install pulsjs-scss
```
```js
import { PulsComponent, CustomElement, html } from 'pulsjs'
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