import {PulsAdapter} from "./PulsAdapter";

export type OnMount = () => any
export type OnMounted = () => any
export type OnUnmount = () => any
export type OnUnmounted = () => any

export let currentPulsInstance: PulsAdapter<any>|undefined = undefined;

export let currentLifecycleHooks: Map<PulsAdapter<any>, {
    setAny: boolean,
    onMounted: OnMounted[],
    onUnmounted: OnUnmounted[],
    onMount: OnMount[],
    onUnmount: OnUnmount[],
}> = new Map()

export function resetLifecycleHooks(pulsInstance: PulsAdapter<any>) {
    currentPulsInstance = pulsInstance
    currentLifecycleHooks.set(pulsInstance, {
        setAny: false,
        onMounted: [],
        onUnmounted: [],
        onMount: [],
        onUnmount: [],
    })
}
export function removeLifecycleHooksFromInstance(pulsInstance: PulsAdapter<any>) {
    if (currentLifecycleHooks.has(pulsInstance)) {
        currentLifecycleHooks.delete(pulsInstance)
        currentPulsInstance = undefined
    }
}

export function onMounted(fn: OnMounted) {
    if (currentPulsInstance === undefined) throw new Error('onMounted called outside of component')
    currentLifecycleHooks.get(currentPulsInstance!)!.setAny = true
    currentLifecycleHooks.get(currentPulsInstance!)!.onMounted.push(fn)
}

export function onUnmounted(fn: OnUnmounted) {
    if (currentPulsInstance === undefined) throw new Error('onUnmounted called outside of component')
    currentLifecycleHooks.get(currentPulsInstance!)!.setAny = true
    currentLifecycleHooks.get(currentPulsInstance!)!.onUnmounted.push(fn)
}

export function onMount(fn: OnMount) {
    if (currentPulsInstance === undefined) throw new Error('onMount called outside of component')
    currentLifecycleHooks.get(currentPulsInstance!)!.setAny = true
    currentLifecycleHooks.get(currentPulsInstance!)!.onMount.push(fn)
}

export function onUnmount(fn: OnUnmount) {
    if (currentPulsInstance === undefined) throw new Error('onUnmount called outside of component')
    currentLifecycleHooks.get(currentPulsInstance!)!.setAny = true
    currentLifecycleHooks.get(currentPulsInstance!)!.onUnmount.push(fn)
}