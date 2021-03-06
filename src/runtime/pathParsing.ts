import { UntypedRoute } from "../types/routes";

// eslint-disable-next-line no-useless-escape
const pathRegex = /^\/([^\/\?&=]+|(?!\/))((?:\/[^\/\?&=]+)*(?:\?[^\/\?&=]+=[^\/\?&=]*(?:&[^\/\?&=]+=[^\/\?&=]*)*)?)$/;

export type ParsedPath = { segments: string[]; queryArgs: Record<string, string> };

export const parsePath = (path: string): ParsedPath => {
    let remaining = path;
    const segments: string[] = [];

    do {
        let match = pathRegex.exec(remaining);
        if (!match) throw new Error(`Failed to parse path ${path}`);

        const seg = match[1];
        if (seg.length)
            segments.push(decodeURIComponent(seg));

        if (match[2]) {
            if (match[2][0] === "?") {
                const queryArgs = Object.fromEntries(
                    match[2].substring(1).split("&").map(x => x.split("=").map(x => decodeURIComponent(x)))
                );

                return { segments, queryArgs };
            } else {
                remaining = match[2];
                continue;
            }
        }

        return { segments, queryArgs: {} };

        // eslint-disable-next-line no-constant-condition
    } while (true);
};

export type UnappliedPath = { route: UntypedRoute; props: object };

export const isPropsSufficient = (props: object, route: UntypedRoute): boolean => {
    for (let i = 0; i < route.path.path.length; i++) {
        const pseg = route.path.path[i];

        if (pseg.T === "prop" && !(pseg.key in props)) return false;
    }

    for (const q of route.path.query) {
        if (!(q.key in props)) return false;
    }

    return true;
};

export const unapplyPath = (route: UntypedRoute, parsed: ParsedPath): UnappliedPath | undefined => {
    if (route.path.path.length !== parsed.segments.length) return;

    const props = {} as Record<string, unknown>;

    for (let i = 0; i < route.path.path.length; i++) {
        const pseg = route.path.path[i];
        const txt = parsed.segments[i];

        if (pseg.T === "str" && txt !== pseg.seg) return;
        if (pseg.T === "prop") {
            props[pseg.key] = pseg.codec.fromString(txt);
        }
    }

    for (const q of route.path.query) {
        if (!(q.key in parsed.queryArgs)) {
            if (q.nullable) continue;
            else return;
        }

        props[q.key] = q.codec.fromString(parsed.queryArgs[q.key]);
    }

    return { route, props: props };
};