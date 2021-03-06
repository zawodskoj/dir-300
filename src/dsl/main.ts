import React from "react";
import { CodecMap } from "../types/codec";
import { ParsePathIntoSegments } from "../types/parsing";
import { CollectProps } from "../types/props";
import { Route, ValidPath, RouteDefinition } from "../types/routes";
import { parsePath } from "../runtime/templateParsing";

type CombinePath<A extends ValidPath, B extends ValidPath> = {
    path: [...A["path"], ...B["path"]]
    query: [...A["query"], ...B["query"]]
};

type EmptyPath = { path: []; query: [] };

interface DslCallSignature<Path extends ValidPath, PMap extends CodecMap, TMap extends CodecMap> {
    <P extends string, ParsedPath extends ParsePathIntoSegments<P, PMap, TMap>, Children extends object = {}>(
        path: P,
        defn: RouteDefinition<CollectProps<CombinePath<Path, ParsedPath>>>,
        children?: (d: Dsl<CombinePath<Path, ParsedPath>, PMap, TMap>) => Children
    ): ParsedPath extends ValidPath
        ? Route<CombinePath<Path, ParsedPath>, CollectProps<CombinePath<Path, ParsedPath>>, Children>
        : never
}

interface Dsl<Path extends ValidPath, PMap extends CodecMap, TMap extends CodecMap>
    extends DslCallSignature<Path, PMap, TMap> {
    readonly pmap: PMap
    readonly tmap: TMap
}

export interface Slash<Children extends object> {
    readonly rootDefn: RouteDefinition<{}>
    readonly routes: Children
}

const slash_ = <PMap extends CodecMap, TMap extends CodecMap, Children extends object = {}>(
    pmap: PMap,
    tmap: TMap,
    defn: RouteDefinition<{}>,
    children: (d: Dsl<EmptyPath, PMap, TMap>) => Children
): Slash<Children> => {
    function dslCallSig<Path extends ValidPath>(parent: Path): DslCallSignature<Path, PMap, TMap> {
        return (p, v, c) => {
            const parsedPath = parsePath(p, pmap, tmap);
            const combinedPath = {
                path: [...parent.path, ...parsedPath.path],
                query: [...parent.query, ...parsedPath.query]
            };

            return {
                path: combinedPath,
                defn: v,
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                children: c ? c(dsl(combinedPath) as never) : {}
            } as never;
        };
    }

    function dsl<Path extends ValidPath>(parent: Path): Dsl<Path, PMap, TMap> {
        return Object.assign(dslCallSig(parent), { pmap, tmap }) as never;
    }

    const dsl0: Dsl<EmptyPath, PMap, TMap> = dsl({ path: [], query: [] });

    return { rootDefn: defn, routes: children(dsl0) };
};

export const slashWithView = <PMap extends CodecMap, TMap extends CodecMap, Children extends object = {}>(
    pmap: PMap,
    tmap: TMap,
    view: React.FC,
    children: (d: Dsl<EmptyPath, PMap, TMap>) => Children
): Slash<Children> =>
    slash_(pmap, tmap, { T: "view", name: "/", view: view }, children);

export const slash = <PMap extends CodecMap, TMap extends CodecMap, Children extends object = {}>(
    pmap: PMap,
    tmap: TMap,
    start: string,
    children: (d: Dsl<EmptyPath, PMap, TMap>) => Children
): Slash<Children> =>
    slash_(pmap, tmap, { T: "redirect", name: "/", target: start }, children);