import {Hook, HookOptions} from './Hook'
import {deepWatchTracker, getDeepValue, setDeepValue} from "./object-watch";

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

export function track<T>(callable: () => T) {
    deepWatchTracker.enableTracking()
    callable()
    const hook = new Hook<T>(undefined as T)
    if (deepWatchTracker.tracked[deepWatchTracker.tracked.length - 1]) {
        const [trHook, keys] = deepWatchTracker.tracked[deepWatchTracker.tracked.length - 1]

        deepWatchTracker.callbacks.push([
            trHook,
            keys,
            () => {
                hook.value = getDeepValue(trHook.value, keys)
            }
        ])
        hook.value = getDeepValue(trHook.value, keys)
        hook.addListener(() => {
            hook.disableDispatch = true
            setDeepValue(trHook.value, keys, hook.value)
            hook.disableDispatch = false
        })
    }
    deepWatchTracker.disableTracking()
    return hook
}

export function reactive<T>(val: T) {
    return state<T>(val, { deep: true }).value
}

export function watch(hooksy: (Hook<any>|(() => any))[], callable: () => any) {
    const hooks = hooksy.map(h => typeof h === 'function' ? track(h) : h) as Hook<any>[]

    const listeners: (() => void)[] = []
    const ret = {
        start() {
            for (let hook of hooks) {
                listeners.push(hook.addListener(callable))
            }
        },
        stop() {
            listeners.forEach(l => l())
        }
    }
    ret.start()

    return ret;
}

export function isHook(val: any): val is Hook<any> {
    return val instanceof Hook
}

export function toState<T>(val: T|Hook<T>|(() => T)): Hook<T> {
    if (val instanceof Hook) {
        return val
    }
    if (typeof val === 'function') {
        return state<T>((val as any)(), { deep: true })
    }
    return state(val, { deep: true })
}

export function toValue<T>(val: T|Hook<T>|(() => T)): T {
    if (val instanceof Hook) {
        return val.value
    }
    if (typeof val === 'function') {
        return toValue((val as any)())
    }
    return val
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