import {Hook} from "./Hook";

export const deepWatchTracker = {
    tracked: [] as [Hook<any>, string[]][],
    isTracking: false,

    track(hook: Hook<any>, keys: string[]) {
        if (deepWatchTracker.isTracking) {
            deepWatchTracker.tracked.push([hook, keys])
        }
    },
    enableTracking() {
        deepWatchTracker.tracked = []
        deepWatchTracker.isTracking = true
    },
    disableTracking() {
        deepWatchTracker.isTracking = false
        deepWatchTracker.tracked = []
    },

    callbacks: [] as [Hook<any>, string[], (val: any) => void][],
}



export function deepWatch<T extends object>(hook: Hook<any>, obj: T, callback: (newVal: any, oldVal: any) => void): T {
    const handler = (keys: string[] = []) => ({
        set(target, property, value, receiver) {
            const oldValue = target[property as keyof T];
            const newValue = value;

            const bol = Reflect.set(target, property, value, receiver);

            deepWatchTracker
                .callbacks
                .filter(([h, k]) => h === hook && (
                    [...keys, property].join('.').startsWith(k.join('.'))
                ))
                .forEach(([_, __, c]) => c(value))

            if (oldValue !== newValue) {
                callback(newValue, oldValue);
            }
            return bol
        },
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            const newKeys = [...keys, property as string]
            deepWatchTracker.track(hook, newKeys)

            if (Array.isArray(target)) {
                if (property === 'push' || property === 'pop' || property === 'shift' || property === 'unshift' || property === 'splice') {
                    return (...v: any[]) => {
                        const m = Reflect.get(target, property, receiver).call(target, ...v)
                        callback(m, undefined)
                        return m;
                    };
                }
            }
            if (value && typeof value === 'object') {
                return new Proxy(value, handler(newKeys) as any);
            }
            return value;
        }
    }) as ProxyHandler<T>;

    return new Proxy(obj, handler());
}

export function getDeepValue(obj: any, keys: string[]) {
    let value = obj;
    for (let key of keys) {
        value = value[key]
    }
    return value;
}
export function setDeepValue(obj: any, keys: string[], value: any) {
    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]]
    }
    target[keys[keys.length - 1]] = value;
}