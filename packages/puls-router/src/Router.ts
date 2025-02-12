import {state, html} from "pulsjs";
import {computed} from "pulsjs-state";

export type ViewCallback = Node[]|undefined|Promise<Node[]|undefined>;

export type Route = {
    name?: string;
    path: string;
    subRouter?: Router;
} & ({
    view: () => ViewCallback;
} | (
    {
        children?: Route[];
    }
    & ({
        view: (template: () => Node[]) => ViewCallback;
    } | {})
) | {
    redirect: string|SearchRoute;
})

export type CurrentRoute = {
    name?: string;
    path: string;
    query: Record<string, string>;
    params: Record<string, string>;
    hash: string;
    route: Route;
}
export type SearchRoute = {
    name?: string;
    query?: Record<string, string>|string;
    params?: Record<string, string>|string;
    hash?: string;
    route?: Route;
}

export class Router {
    currentRoute = state<CurrentRoute|null>(null)
    view = state<Node[]|null>(null)

    private readonly routes: Route[] = []

    latestKnownPath = ''

    isLoading = state(false)
    private popstateEvent?: () => void;

    addRoutes(routes: Route[], startingUrl = '') {
        for (let route of routes) {
            if ('children' in route) {
                if ('view' in route) {
                    const r = new Router(route.children, this.basePath + startingUrl + route.path)

                    for (const rt of r.routes) {
                        this.routes.push({
                            ...rt,
                            view: () => route.view(r.view as any),
                            subRouter: r
                        })
                    }
                    continue;
                }
                this.addRoutes(route.children!, startingUrl + route.path)
                continue;
            }

            const path = this.basePath + startingUrl + route.path

            this.routes.push({...route, path})
        }
    }

    link: (props: { to: string|SearchRoute, $slot: Node[], class: [] }) => Node[] = () => []

    constructor(routes: Route[] = [], private basePath = '') {
        this.addRoutes(routes)

        this.link = ({ to, $slot, class: classList }) => {
            const p = this.getPath(to, true)
            return html`<a class=${{
                'router-link-active': computed(() => this.currentRoute.value?.route.path && this.currentRoute.value?.route.path?.startsWith(p), [this.currentRoute]),
                'router-link-active-exact': computed(() => this.currentRoute.value?.route.path === p, [this.currentRoute]),
                ...(Array.isArray(classList) ? classList.reduce((prev, v) => ({...prev, [v]: true}), {}) :  classList)
            }} href=${this.getPath(to)} @click.prevent=${() => this.go(to)}>${$slot}</a>`
        }
    }

    getPath(to: string|SearchRoute, ignoreAdditions = false) {
        if (typeof to === 'string') {
            if (ignoreAdditions) {
                to = to.split('?', 1)[0].split('#', 1)[0]
            }
            return to
        }

        const route = to as SearchRoute
        let path = route.name && this.routes.find(r => r.name === route.name)?.path
        if (path === undefined) {
            if (route.name) console.warn('Route not found', route)
            path = ''
        }
        if (ignoreAdditions) return path;

        if (to.params) {
            for (const [key, value] of Object.entries(to.params)) {
                path = path.replace(`:${key}`, value)
            }
        }

        if (to.query) {
            if (typeof to.query === 'string') {
                path += to.query.startsWith('?') ? to.query : `${to.query}`
            } else {
                path += '?' + Object.keys(to.query)
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent((to.query as any)[key])}`)
                    .join('&')
            }
        }

        if (to.hash && to.hash !== '#') {
            path += to.hash.startsWith('#') ? to.hash : `#${to.hash}`
        }

        return path
    }

    async go(to: string|SearchRoute, reloadIfChanged = true) {
        if (typeof to === 'string') {
            [to] = to.split('?', 1);
            [to] = to.split('#', 1);
        }
        const path = this.getPath(to)

        window.history.pushState({}, '', new URL(path, window.location.href))

        this.latestKnownPath = window.location.pathname

        await this.run(reloadIfChanged)
        await this.currentRoute.value?.route?.subRouter?.go(to, reloadIfChanged)
    }

    private async run(reloadIfChanged = true) {
        const currentPath = window.location.pathname

        for (const route of this.routes) {
            const {name, path} = route

            const splitPath = path.split('/')
            const splitCurrentPath = currentPath.split('/')

            if (splitPath.length !== splitCurrentPath.length && !path.includes('*'))
                continue

            let isCorrect = true
            const params = {}

            for (let ind in splitPath) {
                if (!isCorrect) continue
                const item = splitPath[ind]

                const currentPathItem = splitCurrentPath[ind]
                if (currentPathItem === undefined) isCorrect = false;

                if (item === currentPathItem)
                    continue;

                if (item.length > 0 && item[0] === ':') {
                    let paramName = item.substring(1)

                    if (paramName.includes('(')) {
                        const name = paramName.substring(0, paramName.indexOf('('))
                        const regex = paramName.substring(paramName.indexOf('(') + 1, paramName.length - 1)

                        paramName = name
                        const reg = new RegExp(`^(${regex})$`)

                        if (!reg.test(currentPathItem)) {
                            isCorrect = false
                            continue
                        }
                    }
                    if (paramName.includes('*')) {
                        paramName = paramName.substring(0, paramName.length - 1)
                        ;(params as any)[paramName] = currentPathItem
                        isCorrect = true
                        break
                    }
                    ;(params as any)[paramName] = currentPathItem
                    continue
                }

                if (item === '*') {
                    isCorrect = true
                    break
                }
                isCorrect = false
            }

            if (isCorrect) {
                const latestRoute = this.currentRoute.value?.route
                this.currentRoute.value = {
                    path: currentPath,
                    name,
                    route,
                    query: new Proxy(new URLSearchParams(window.location.search), {
                        get: (searchParams, prop: string) => searchParams.get(prop),
                    }) as unknown as Record<string, string>,
                    hash: window.location.hash,
                    params
                }

                if (!reloadIfChanged && latestRoute === route)
                    break;


                this.isLoading.value = true
                if (latestRoute?.subRouter && latestRoute?.subRouter !== route.subRouter) {
                    await latestRoute.subRouter.destroy()
                }

                if ('redirect' in route) {
                    this.go(route.redirect)
                } else if ('view' in route) {
                    this.view.value = html`${await (route.view as (() => Node[] | Promise<Node[]>))()}`
                }

                if (route.subRouter && latestRoute?.subRouter !== route.subRouter) {
                    await route.subRouter.init()
                }
                this.isLoading.value = false

                break
            }
        }
    }

    async init() {
        this.popstateEvent = () => {
            if (window.location.pathname !== this.latestKnownPath) {
                this.run()
            }
        }
        window.addEventListener('popstate', this.popstateEvent)
        await this.run()
    }

    async destroy() {
        if (this.popstateEvent) {
            window.removeEventListener('popstate', this.popstateEvent)
        }
        this.view.value = null
    }
}