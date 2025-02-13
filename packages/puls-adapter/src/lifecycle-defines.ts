export type EmitFunction = (name: string, ...args: any[]) => any

export const currentLifecycleDefines = {
    props: {},
    emitsFunction: undefined as EmitFunction|undefined,
    exports: {} as Record<string, any>,
    slot: undefined as any
}

export function defineProps<T>(): T {
    return currentLifecycleDefines.props as T
}


export function defineEmits<T extends Record<string, ((...args: any[]) => any)>>(
): <K extends keyof T>(event: K, ...args: Parameters<T[K]>) => T[K] {
    return currentLifecycleDefines.emitsFunction! as any
}

export function defineExports(exprts: any): any {
    currentLifecycleDefines.exports = exprts
}

export function defineSlot<T>(): T {
    return currentLifecycleDefines.slot
}