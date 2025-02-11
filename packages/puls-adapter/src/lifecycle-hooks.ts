export type OnMount = () => any
export type OnMounted = () => any
export type OnUnmount = () => any
export type OnUnmounted = () => any

export let currentLifecycleHooks: {
    setAny: boolean,
    onMounted: OnMounted[],
    onUnmounted: OnUnmounted[],
    onMount: OnMount[],
    onUnmount: OnUnmount[],
} = {
    setAny: false,
    onMounted: [],
    onUnmounted: [],
    onMount: [],
    onUnmount: [],
}

export function resetLifecycleHooks() {
    currentLifecycleHooks = {
        setAny: false,
        onMounted: [],
        onUnmounted: [],
        onMount: [],
        onUnmount: [],
    }
}

export function onMounted(fn: OnMounted) {
    currentLifecycleHooks.setAny = true
    currentLifecycleHooks.onMounted.push(fn)
}

export function onUnmounted(fn: OnUnmounted) {
    currentLifecycleHooks.setAny = true
    currentLifecycleHooks.onUnmounted.push(fn)
}

export function onMount(fn: OnMount) {
    currentLifecycleHooks.setAny = true
    currentLifecycleHooks.onMount.push(fn)
}

export function onUnmount(fn: OnUnmount) {
    currentLifecycleHooks.setAny = true
    currentLifecycleHooks.onUnmount.push(fn)
}