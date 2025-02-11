import {state, html} from "pulsjs";
import {ParserOutput} from "pulsjs-template";

export type Route = {
    name: string;
    path: string;
    view: () => Node[]|undefined|Promise<Node[]|undefined>;
}

export type CurrentRoute = {
    name: string;
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

    routes: Route[] = []

    latestKnownPath = ''

    isLoading = state(false)


    link: (props: { to: string|SearchRoute, $slot: Node[] }) => Node[] = () => []
    constructor(routes: Route[] = []) {
        this.routes = routes

        this.link = ({ to, $slot }) => {
            return html`<a href=${to} @click.prevent=${() => this.go(to)}>${$slot}</a>`
        }
    }

    getPath(to: string|SearchRoute) {
        if (typeof to === 'string')
            return to

        const route = to as CurrentRoute
        let path = route.path

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
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent((to.params as any)[key])}`)
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
        window.history.pushState(path, path, path)
        this.latestKnownPath = window.location.pathname

        await this.run(reloadIfChanged)
    }

    async run(reloadIfChanged = true) {
        const currentPath = window.location.pathname
        for (const route of this.routes) {
            const {name, path, view} = route

            const splitPath = path.split('/')
            const splitCurrentPath = currentPath.split('/')

            if (splitPath.length !== splitCurrentPath.length)
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
                    (params as any)[item.substring(1)] = currentPathItem
                    continue
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

                this.view.value = html`${await view()}`

                this.isLoading.value = false
                break
            }
        }
    }

    async init() {
        window.addEventListener('popstate', () => {
            if (window.location.pathname !== this.latestKnownPath) {
                this.run()
            }
        })
        await this.run()
    }
}