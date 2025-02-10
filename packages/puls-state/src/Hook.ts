export type HookListener<T> = (val: T, oldVal: T) => void

export type HookOptions = { deep?: boolean }

export class Hook<T> {
    listeners: HookListener<T>[] = []

    #destroyed = false
    #alreadyProxied = false

    static TRACKING: Hook<any>[] = []
    static IS_TRACKING = false

    constructor(private _value: T, private options: HookOptions = {deep: false}) {
        this.setValue(_value)
    }

    setValue(val: T, dispatch = true) {
        if (this.options.deep) {
            if (val && typeof val === 'object') {
                val = new Proxy(val, {
                    set: (target: object, p: string | symbol, newValue: any, receiver: any): boolean => {
                        this.dispatchListener(val)
                        return true
                    },
                    get: (target: object, p: string | symbol, receiver: any): any => {
                        if (Array.isArray(target)) {
                            if (p === 'push' || p === 'pop' || p === 'shift' || p === 'unshift' || p === 'splice') {
                                return (...v: any[]) => {
                                    const m = Reflect.get(target, p, receiver).call(target, ...v)
                                    this.dispatchListener(val)
                                    return m;
                                };
                            }
                        }
                        return Reflect.get(target, p, receiver)
                    }
                }) as T
            }
        }

        const old = this._value
        this._value = val
        if (dispatch) {
            this.dispatchListener(old)
        }
    }

    set value(val: T) {
        if (this.#destroyed) {
            return;
        }
        this.setValue(val)
    }

    get value(): T {
        Hook.track(this)
        return this._value
    }

    destroy() {
        this.#destroyed = true
        this.listeners = []
    }

    dispatchListener(oldVal: T) {
        for (let listener of this.listeners) {
            try {
                listener.call(this, this._value, oldVal)
            } catch (e) {
                console.error(e)
            }
        }
    }

    addListener(listener: HookListener<T>) {
        this.listeners.push(listener)

        return () => {
            this.removeListener(listener)
        }
    }

    removeListener(listener: HookListener<T>) {
        this.listeners = this.listeners.filter(l => l !== listener)
    }

    toString() {
        return `${this.value}`
    }

    /**
     * computed((val) => `Hello ${val}`)
     */
    computed(fn: (v: T) => any): Hook<any> {
        const computedHook = new Hook(fn(this.value))

        this.addListener(() => {
            computedHook.value = fn(this.value)
        })

        return computedHook
    }

    $(fn: (v: T) => any): Hook<any> {
        return this.computed(fn)
    }

    static track(hook: Hook<any>) {
        if (Hook.IS_TRACKING) {
            Hook.TRACKING.push(hook)
        }
    }

    static enableTracking() {
        Hook.IS_TRACKING = true
    }
    static disableTracking() {
        Hook.IS_TRACKING = false
        Hook.clearTracked()
    }

    static getTracked(): Hook<any>[] {
        return Hook.TRACKING
    }

    static clearTracked() {
        Hook.TRACKING = []
    }
}