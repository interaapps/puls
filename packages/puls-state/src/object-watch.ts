export function deepWatch<T extends object>(obj: T, callback: (newVal: any, oldVal: any) => void): T {
    const handler: ProxyHandler<T> = {
        set(target, property, value, receiver) {
            const oldValue = target[property as keyof T];
            const newValue = value;

            if (oldValue !== newValue) {
                callback(newValue, oldValue);
            }

            return Reflect.set(target, property, value, receiver);
        },
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            
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
                return new Proxy(value, handler as any);
            }
            return value;
        }
    };

    return new Proxy(obj, handler);
}
