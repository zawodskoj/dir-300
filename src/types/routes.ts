import { ReactElement } from "react";
import { PathSeg, QuerySeg } from "./parsing";

type RouteName<Props> = string | ((p: Props) => string);

export interface RedirectDef<Props extends object> {
    T: "redirect"
    name: RouteName<Props>
    target: string | ((p: Props) => string)
}

export const redirect = <Props extends object = {}>(
    name: RouteName<Props>,
    target: string | ((p: Props) => string)
): RedirectDef<Props> => ({ T: "redirect", target, name });

export interface RoutedView<Props extends object> {
    T: "view"
    name: string | ((p: Props) => string)
    view: (p: Props) => ReactElement | null
}

export const routedView = <Props extends object>(
    name: RouteName<Props>,
    view: (p: Props) => ReactElement | null
): RoutedView<Props> => ({ T: "view", view, name });

export type RouteDefinition<Props extends object> = RedirectDef<Props> | RoutedView<Props>;

export interface UntypedRoute {
    readonly path: ValidPath
    readonly defn: RouteDefinition<object>
    readonly children: Record<string, UntypedRoute>
}

export interface Route<Path extends ValidPath, Props extends object, Children extends object> {
    readonly path: Path
    readonly defn: RouteDefinition<Props>
    readonly children: Children
}

export type ValidPath = { path: PathSeg[]; query: QuerySeg<string, unknown, boolean>[] };