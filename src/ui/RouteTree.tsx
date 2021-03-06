import React from "react";
import { NavigationOps } from "./index";
import { UntypedRoute } from "../types/routes";
import { FC } from "react";
import { isPropsSufficient } from "../runtime/pathParsing";

export interface RouteTreeElementProps {
    curRoute: UntypedRoute | undefined
    depth: number
    route: UntypedRoute
    curProps: object
    nav: NavigationOps
}

interface RouteTreeNodeProps {
    depth: number
    nav: NavigationOps
    curRoute: UntypedRoute | undefined
    curProps: object
    route: UntypedRoute
    element: FC<RouteTreeElementProps>
    innerLayout: FC
}

interface RouteTreeProps {
    nav: NavigationOps
    routes: Record<string, UntypedRoute>
    element: FC<RouteTreeElementProps>
    innerLayout: FC
}

function RouteTreeElement(x: RouteTreeNodeProps) {
    const Layout = x.innerLayout;
    const E = x.element;

    return <>
        <E route={x.route} curProps={x.curProps} nav={x.nav} depth={x.depth} curRoute={x.curRoute} />
        <Layout>
            {
                Object.values(x.route.children)
                    .filter(xx => isPropsSufficient(x.curProps, xx))
                    .map((r, i) => <RouteTreeElement key={i}
                                                     curRoute={x.curRoute}
                                                     depth={x.depth + 1}
                                                     nav={x.nav}
                                                     curProps={x.curProps}
                                                     route={r}
                                                     element={E}
                                                     innerLayout={Layout} />)
            }
        </Layout>
    </>;
}

export function RouteTree(x: RouteTreeProps) {
    if (!x.nav.store) throw null;
    const s = x.nav.store.use();
    const curProps = s.matched?.props ?? {};
    console.log("render routeTree");

    return <>
        {
            Object.values(x.routes)
                .filter(x => isPropsSufficient(curProps, x))
                .map((r, i) => <RouteTreeElement key={i}
                                                 curRoute={s.matched?.route}
                                                 depth={0}
                                                 nav={x.nav}
                                                 curProps={curProps}
                                                 route={r}
                                                 element={x.element}
                                                 innerLayout={x.innerLayout} />)
        }
    </>;
}