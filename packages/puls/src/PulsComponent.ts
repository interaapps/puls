import {appendTo, Hook} from "../index";

export type PulsComponentOptions = {
    shadowed?: boolean;
    style?: string | null;
};
export type AttributeOptions = {
    name?: string | null | undefined;
};

export class PulsComponent extends (typeof HTMLElement === 'undefined' ? class {
    constructor() {
        console.error("Your Runtime can't create a PulsComponent. This may result into errors. HTMLElement is not defined.")
    }
} as new() => HTMLElement : HTMLElement) {
    public readonly __puls_inject_hooks_as_value = true

    mainElement: ShadowRoot|HTMLElement|null = null

    #__puls_connected_already: boolean = false

    mutationObserver: MutationObserver|null = null

    constructor(public options: PulsComponentOptions = {}) {
        super()
        this.options = options
    }

    async connectedCallback() {
        if (this.#__puls_connected_already)
            return;

        this.addEventListener(':attach', () => this.attach())
        this.addEventListener(':attached', () => this.attached())
        this.addEventListener(':detach', () => this.detach())
        this.addEventListener(':detached', () => this.detached())

        this.#__puls_connected_already = true

        const { shadowed = false, style = null } = this.options

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


        this.mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    if (mutation.attributeName && mutation.attributeName in this) {
                        this.setAttribute(mutation.attributeName, this.getAttribute(mutation.attributeName))
                    }
                    this.dispatchEvent(new CustomEvent(':attributechanged', {detail: {mutation}}))
                }
            })
        })

        for (let attributeName of this.getAttributeNames()) {
            if (attributeName in this) {
                this.setAttribute(attributeName, this.getAttribute(attributeName))
            } else {
                if (attributeName.startsWith(':')) {
                    const newAttributeName = attributeName.substring(1)
                    const attrVal = this.getAttribute(attributeName)
                    if (newAttributeName in this && attrVal) {
                        this.setAttribute(newAttributeName, JSON.parse(attrVal))
                    }
                }
            }
        }
        this.connectObserver()
    }

    connectObserver() {
        this.mutationObserver?.observe(this, {attributes: true})
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

    disconnectedCallback() {
        this.mutationObserver?.disconnect()
    }

    render(): Node[]|null|Promise<Node[]|null> {
        throw new Error('Not implemented')
    }

    styles(): string {
        return ''
    }

    setAttribute(key: string, value: any) {
        this.mutationObserver?.disconnect()
        if (key in this) {
            const v = (this as any)[key];

            if (value instanceof Hook && !(v instanceof Hook)) {
                value.addListener(() => {
                    (this as any)[key] = value.value
                })
                ;(this as any)[key] = value.value
            } else if (!(value instanceof Hook) && v instanceof Hook) {
                ;(this as any)[key].value = value
            } else {
                ;(this as any)[key] = value
            }
        } else {
            super.setAttribute(key, value)
        }
        this.connectObserver()
    }

    /**
     * @type {typeof PulsComponent}
     */
    static unshadowed = class PulsUnshadowedComponent extends PulsComponent {
        constructor(options = {}) {
            super({ shadowed: false, ...options })
        }
    }

    dispatchEvent(event: Event) {
        return super.dispatchEvent(event)
    }
}