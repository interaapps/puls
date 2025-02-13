# PulsJS JSX

```bash
npm install pulsjs-jsx
```


## Vite Config
```js
export default {
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxImportSource: 'pulsjs-jsx'
    },
    // ...
}
```

## TS-Config
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "pulsjs-jsx"
  }
}

```