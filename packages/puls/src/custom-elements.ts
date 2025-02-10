let compIndex = 0;
export function registerComponent(
    tag: string|Record<string, CustomElementConstructor>|CustomElementConstructor|(CustomElementConstructor)[],
    component: CustomElementConstructor|undefined = undefined
) {
    if (typeof  tag === 'string') {
        window.customElements.define(tag, component!)
        return component
    } else if (Array.isArray(tag)) {
        tag.forEach((clazz) => {
            registerComponent(clazz)
        })
        return;
    } else if (tag?.prototype instanceof Node || tag?.prototype instanceof HTMLElement || tag?.prototype instanceof HTMLElement) {
        const clazz = tag

        const str = clazz.name as string
        const camelCaseStr = str.charAt(0).toLowerCase() + str.slice(1);

        let name = camelCaseStr.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        name = name.includes('-') ? name : `jdom-${name}`

        const alreadyRegisted = window.customElements.get(name)
        if (alreadyRegisted) {
            if (alreadyRegisted === clazz) {
                return;
            } else {
                name += `-${++compIndex}`
            }
        }

        window.customElements.define(name, clazz as CustomElementConstructor)
    }
    Object.entries(tag).forEach(([name, comp]) => {
        window.customElements.define(name, comp)
    })
}