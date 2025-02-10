import {appendTo, Hook} from "../index";
import {HookListener} from "pulsjs-state";

export type PulsComponentOptions = {
    shadowed?: boolean;
    style?: string | null;
};
export type AttributeOptions = {
    name?: string | null | undefined;
};

export class PulsComponent extends HTMLElement {
    mainElement: ShadowRoot|HTMLElement|null = null

    #jdomConnectedAlready: boolean = false

    attributeListeners: { key: string, options: AttributeOptions }[] = []

    constructor(public options: PulsComponentOptions = {}) {
        super()
        this.options = options

        this.registerAttributeListener()
    }

    async connectedCallback() {
        if (this.#jdomConnectedAlready)
            return;

        this.addEventListener(':attach', () => this.attach())
        this.addEventListener(':attached', () => this.attached())
        this.addEventListener(':detach', () => this.detach())
        this.addEventListener(':detached', () => this.detached())

        this.#jdomConnectedAlready = true

        const { shadowed = false, style = null } = this.options
        this.registerAttributeListener()

        this.mainElement = this as HTMLElement

        if (shadowed) {
            this.mainElement = this.attachShadow({mode: 'closed'})
        }

        await this.setup()

        const content = await this.render() // It may be async
        if (content !== null) {
            appendTo(this.mainElement, content)
        }

        if (style) {
            this.addStyle(style)
        }

        let styleFromFunc = this.styles()
        if (styleFromFunc)
            this.addStyle(styleFromFunc)


        new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    this.dispatchEvent(new CustomEvent(':attributechanged', {detail: {mutation}}))
                }
            })
        }).observe(this, {
            attributes: true
        })
    }

    registerAttributeListener() {
        if (this.attributeListeners) {
            for (let attributeListener of this.attributeListeners) {
                const {key, options: {name = null}} = attributeListener
                const attrName = name || key

                const hook = (this as any)[key] as any
                if (hook instanceof Hook) {
                    hook.value = this.getAttribute(attrName)
                } else {
                    (this as Record<any, any>)[key] = this.getAttribute(attrName)
                }

                let lastListener: HookListener<any>|null = null
                this.addEventListener(':attributechanged', e => {
                    const { detail: { mutation } } = e as CustomEvent

                    if (!lastListener) {
                        const hook = (this as any)[key] as Hook<any>
                        const listener = hook.addListener(val => {
                            this.setAttribute(attrName, val)
                        })
                        lastListener = listener

                        this.addEventListener(':detached', e => hook.removeListener(listener))
                    }

                    if (mutation.attributeName === attrName) {
                        const attrVal = this.getAttribute(attrName)
                        const v = (this as any)[key] as any
                        if (v instanceof Hook) {
                            if (v.value !== attrVal) {
                                v.value = attrVal
                            }
                        } else {
                            (this as Record<any, any>)[key] = attrVal as any
                        }
                    }
                })
            }
        }
    }

    /**
     * @param key
     * @param options
     */
    addAttributeListener(key: string, options: AttributeOptions = {}) {
        this.attributeListeners.push({ key, options })
    }

    setup(): void|Promise<void> {}

    detach() {}
    detached() {}
    attach() {}
    attached() {}

    addStyle(style: string) {
        const styleEl = document.createElement('style')
        styleEl.textContent = style
        this.mainElement?.appendChild(styleEl)
    }

    render(): Node[]|null|Promise<Node[]|null> {
        throw new Error('Not implemented')
    }

    styles(): string {
        return ''
    }

    /**
     * @type {typeof PulsComponent}
     */
    static unshadowed = class JDOMUnshadowedComponent extends PulsComponent {
        constructor(options = {}) {
            super({ shadowed: false, ...options })
        }
    }

    dispatchEvent(event: Event) {
        return super.dispatchEvent(event)
    }
}