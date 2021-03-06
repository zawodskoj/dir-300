import { UnappliedPath, ParsedPath, parsePath, unapplyPath } from "./pathParsing";
import { RouteDefinition, UntypedRoute } from "../types/routes";

const traverse = (cur: UntypedRoute, parsed: ParsedPath): UnappliedPath | undefined => {
    const unapplied = unapplyPath(cur, parsed);
    if (unapplied)
        return unapplied;

    for (const childN in cur.children) {
        const traversed = traverse(cur.children[childN], parsed);

        if (traversed)
            return traversed;
    }
};

export const match1 = (
    rootDefn: RouteDefinition<{}>,
    root: Record<string, UntypedRoute>,
    path: string
): UnappliedPath | undefined => {
    if (path.trim() === "/")
        return { route: { children: root, defn: rootDefn, path: { path: [], query: [] } }, props: {} };

    const parsed = parsePath(path);

    for (const childN in root) {
        const traversed = traverse(root[childN], parsed);

        if (traversed)
            return traversed;
    }
};

export const match = (
    rootDefn: RouteDefinition<{}>,
    root: Record<string, UntypedRoute>,
    path: string
): { matched: UnappliedPath; targetPath: string } | undefined => {
    let iterCount = 0;
    const maxIterCount = 5;

    let curPath = path;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const matched = match1(rootDefn, root, curPath);
        if (!matched) return undefined;

        if (matched.route.defn.T === "view") {
            return { matched, targetPath: curPath };
        }

        if (iterCount > maxIterCount)
            throw new Error("maxIterCount reached on redirects");

        iterCount++;
        if (typeof matched.route.defn.target === "string") {
            curPath = matched.route.defn.target;
        } else {
            curPath = matched.route.defn.target(matched.props);
        }
    }
};