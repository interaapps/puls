# Puls Compiler (Experimental)

```bash
npm install pulsjs-compiler
```

`vite.config.ts`
```js
import {pulsVite} from "pulsjs-compiler";

export default {
    plugins: [
        pulsVite()
    ]
}
```


`ExampleComponent.puls`
```html
<script>
import { state } from 'pulsjs';

const name = state('John Doe');
</script>

<h1>${name}</h1>
<input :bind=${name} />
```

`index.js`
```js
import ExampleComponent from './ExampleComponent.puls';

appendTo(document.body, html`
    <${ExampleComponent} />
`)
```

# IDE support
Currently PulsJS IDE has no official plugins. For simple autocompletion and syntax highlighting, you can use the Svelte plugins.