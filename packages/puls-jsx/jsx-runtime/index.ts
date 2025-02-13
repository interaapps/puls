import {html} from "pulsjs";

export function h(type: any, props?: any, children: any[] = []) {
    if (props && Array.isArray(props)) {
        children = props
        props = {}
    }

    if (props && props.children) {
        children = props.children;
        delete props.children;
    }

    return html`<${type} :props=${
        Object.entries(props || {})
            .map(([key, value]) => {
                if (key.startsWith('on:')) {
                    key = key.replace('on:', '@')
                }
                if (key === 'classList' || key === 'className') {
                    key = 'class'
                }
                if (key === 'p:bind') {
                    key = ':bind'
                }
                if (key === 'p:if') {
                    key = ':if'
                }
                if (key === 'p:else-if') {
                    key = ':else-if'
                }
                if (key === 'p:else') {
                    key = ':else-if'
                }

                return [key, value]
            })
            .reduce((prev, curr) => ({...prev, [curr[0] as string]: curr[1]}), {})
    }>${children}</${type}>`
}

export function Fragment(...a: any) {
    console.log(a)
    console.log('fragment called --------------------------------')
}

export const jsx = h
export const jsxs = h
export const jsxDEV = h