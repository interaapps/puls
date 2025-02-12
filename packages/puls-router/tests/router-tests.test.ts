import {Router} from "../src/Router";

describe("Router", () => {
    let router: Router;

    beforeEach(async () => {
        router = new Router([
            { name: "home", path: "/", view: () => [document.createTextNode("Home")] },
            { name: "about", path: "/about", view: () => [document.createTextNode("About")] },
            { name: "redirect", path: "/old", redirect: "/new" }
        ]);
        await router.init();
    });

    test("should resolve correct path", () => {
        expect(router.getPath("/about")).toBe("/about");
        expect(router.getPath({ name: "home" })).toBe("/");
    });

    test("should navigate to a new route", async () => {
        const pushStateSpy = jest.spyOn(window.history, "pushState");
        await router.go("/about");
        expect(router.latestKnownPath).toBe("/about");
        expect(window.location.pathname).toBe("/about");
        pushStateSpy.mockRestore();
    });

    test("should handle redirects correctly", async () => {
        const pushStateSpy = jest.spyOn(window.history, "pushState");
        await router.go("/old");
        await new Promise((r) => setTimeout(r, 10)); // Warten auf Redirect
        expect(router.latestKnownPath).toBe("/new");
        expect(window.location.pathname).toBe("/new");
        pushStateSpy.mockRestore();
    });

    test("should parse route parameters", async () => {
        router.addRoutes([{ name: "user", path: "/user/:id", view: () => [document.createTextNode("User")] }]);
        await router.go("/user/42");
        expect(router.currentRoute.value?.params.id).toBe("42");
        expect(window.location.pathname).toBe("/user/42");
    });
});
