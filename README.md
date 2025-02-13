# PULS

```js
import { html, appendTo, state } from 'pulsjs'

const name = state('John')

appendTo(document.body, html`
    <h1>Hello ${name}!</h1>
    
    <input :bind=${name}>
`)
```

## Installation
```bash
npm install pulsjs
```

### Create with Vite
Create a typescript or javascript project with PulsJS and Vite 
```bash
npm create pulsjs@latest my-app-name
```

### ESM import in browser
```html
<script type="module">
    import { html, appendTo, state } from 'https://cdn.skypack.dev/pulsjs'
    ...
</script>
```


## Feature overview
- Puls uses the DOM directly (no virtual DOM)
- Reactive state
- Computed values
- Components
- Control flow
- Event handling
- Bindings

## Hooks (state)
```js
import { state, computed, watch, html, appendTo } from 'pulsjs'

const name = state('John')

const computedValue = computed(() => `I'm happy that you are named ${name.value}`)

watch([name], () => {
    console.log('Name changed')
})

appendTo(document.body, html`
    <h1>Hello ${name}!</h1>
    
    ${computedValue}
    
    <input :bind=${name}>
`)
```

### State Helper
```js
import { track, state } from 'pulsjs'

const hello = state({
    hello: 'World',
    world: 'example'
}, { deep: true })

watch([track(() => hello.value)], () => {
    console.log('Hello changed')
})

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

### Puls Component Files (pulsjs-compiler)
Example `ExampleComponent.puls`
```svelte
<script>
import { state } from 'pulsjs'
const name = state('John Doe');
</script>

<h1>${name}</h1>
<input :bind=${name} />
```
[More Information](https://github.com/interaapps/puls/blob/main/packages/puls-compiler/README.md)

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

### JSX
```jsx
export function Test() {
    const name = state('John')
    return (
        <div>
            {name}
            <input p-bind={name} />
            <button on:click={() => name.value = 'test'}>Click me</button>
        </div>
    )
}
```


### Router
```bash
npm install pulsjs-router
```
```js
import { PulsComponent, CustomElement, html } from 'pulsjs'
import { Router } from 'pulsjs-router'


const router = new Router([
    {
        path: '/',
        name: 'home',
        view: () => html`
            <div>
                <h1>Router Works!</h1>
            </div>
        `
    },
    {
        path: '/test',
        name: 'test',
        view: () => html`
            <div>
                <h1>Router page 2!</h1>
            </div>
        `
    },
    {
        path: '/*',
        name: '404',
        view: () => html`
            <div>
                <h1>404</h1>
            </div>
        `
    }
    
    // Also supports nested routes with children and layouting
])

appendTo(document.body, html`
    <div>
        ${router.link}
    </div>
    <${router.link} to=${{name: 'home'}}>Home</${router.link}>
    <${router.link} to="/test">Test Page</${router.link}>
`)
router.init()
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