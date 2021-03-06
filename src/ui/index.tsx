import React, { createContext, useContext, useEffect } from "react";
import { RouteDefinition, UntypedRoute } from "../types/routes";
import { match } from "../runtime/matching";
import { UnappliedPath } from "../runtime/pathParsing";
import { PathString, Slash } from "../dsl";
import {Store, ReadOnlyStore} from "../store/Store";

export interface NavigationContextData {
    rootDefn: RouteDefinition<{}>
    routes: Record<string, UntypedRoute>
    path: string
    matched: UnappliedPath | undefined
}

interface NavigationContextReducers {
    setPath(x: NavigationContextData, p: { rawPath: string, replace: boolean }): NavigationContextData
}

export interface NavigationOps {
    store: ReadOnlyStore<NavigationContextData>
    go(path: PathString): void
    goBack(): void
}

export interface Router {
    store: ReadOnlyStore<NavigationContextData>
    Viewport: React.FC
}

function createNavStore<C extends object>(s: Slash<C>): Store<NavigationContextData, NavigationContextReducers> {
    const initial: NavigationContextData = {
        rootDefn: s.rootDefn,
        routes: s.routes as never,
        matched: undefined,
        path: ""
    }

    return Store<NavigationContextData, NavigationContextReducers>(initial, {
        setPath(x, p) {
            if (x.path === p.rawPath) return x;

            // effectful function (bad practice but who cares)
            const m = match(x.rootDefn, x.routes, p.rawPath);
            if (m === undefined) return { ...x, matched: undefined, path: p.rawPath };
            const { matched, targetPath } = m;

            const hash = "#" + targetPath;
            if (window.location.hash !== hash) {
                if (p.replace)
                    window.history.replaceState(undefined, "", hash);
                else
                    window.history.pushState(undefined, "", hash);
            }

            if (matched && x.matched) {
                if (matched.route === x.matched.route) {
                    // shallow-equal for props

                    let propsMatching = true;
                    for (const propKey in matched.props) {
                        if (matched.props[propKey as keyof typeof matched.props] !==
                            x.matched.props[propKey as keyof typeof matched.props]
                        ) {
                            propsMatching = false;
                            break;
                        }
                    }

                    if (!propsMatching)
                        return { ...x, path: p.rawPath };
                }
            }

            return { ...x, matched: matched, path: targetPath };
        },
    });
}

const context = createContext<Store<NavigationContextData, NavigationContextReducers> | undefined>(undefined);

export function useNav(): NavigationOps {
    const store = useContext(context);
    
    if (!store) throw new Error("Attempted to call useNav outside navigation context");

    return {
        store,
        go(path: PathString) {
            store.actions.setPath({ rawPath: path, replace: false });
        },
        goBack() {
            window.history.back();
        }
    };
}

export function createRouter<C extends object>(slash: Slash<C>): Router {
    const store = createNavStore(slash);
    store.actions.setPath({ rawPath: window.location.hash.substr(1) || "/", replace: true });

    return {
        store,
        Viewport: x => {
            useEffect(() => {
                const updateState = () => {
                    store.actions.setPath({ rawPath: window.location.hash.substr(1) || "/", replace: true });
                };

                window.addEventListener("popstate", updateState);
                updateState();

                return () => {
                    window.removeEventListener("popstate", updateState);
                };
            });

            return <context.Provider value={store}>{ x.children }</context.Provider>;
        }
    };
}

const PortalWithStore: React.FC<{ store: ReadOnlyStore<NavigationContextData> }> = x => {
    const { matched } = x.store.use();

    if (!matched) return <>No route matched for path</>;
    switch (matched.route.defn.T) {
        case "view": {
            const V = matched.route.defn.view;
            return <V {...matched.props} />;
        }
        case "redirect":
            return <>Warning: unprocessed redirect</>;
    }
};

export const Portal: React.FC = () => {
    const store = useContext(context);

    return store ? <PortalWithStore store={store} /> : <>No context at portal</>;
};