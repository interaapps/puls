import {Hook, HookOptions} from './Hook'

export function state<T>(initialValue: T, options: HookOptions = {}): Hook<T> {
    return new Hook(initialValue, options)
}

/**
 * If dependencies is not given, the dependencies will be automatically seletected
 */
export function computed<T>(callable: () => T, dependencies: Hook<any>[]|undefined = undefined): Hook<T> {
    const hook = new Hook(callable())

    if (dependencies === undefined) {
        Hook.enableTracking()
        callable()

        for (const trackedElement of Hook.getTracked()) {
            trackedElement.addListener(() => {
                hook.value = callable()
            })
        }
        Hook.disableTracking()
    } else {
        for (let dependency of dependencies) {
            dependency.listeners.push(() => {
                hook.value = callable()
            })
        }
    }

    return hook
}

export function watch(hooks: Hook<any>[], callable: () => any) {
    for (let hook of hooks) {
        hook.addListener(callable)
    }
}


export function bind<T>(component: HTMLElement, attr = 'value'): Hook<T> {
    // @ts-ignore
    const hook = new Hook(component[attr])

    component.addEventListener(`input:${attr}`, () => {
        // @ts-ignore
        hook.value = component[attr]
    })

    hook.addListener(val => {
        // @ts-ignore
        if (component[attr] !== val) {
            // @ts-ignore
            component[attr] = hook.value
        }
    })

    return hook
}