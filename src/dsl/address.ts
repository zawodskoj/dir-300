import { Route, UntypedRoute, ValidPath } from "../types/routes";
import { Slash } from "./main";

export type PathString = string & { __T: "path-string" };

interface AddressOps { $unsafeRoute: UntypedRoute }
type AddressFn<Props> = AddressOps & ({} extends Props ? { (): PathString } : { (p: Props): PathString });

type AddressGroupChild<R> = R extends Route<ValidPath, infer P, infer C> ? AddressGroup<P, C, R> : never;
export type AddressGroup<P extends object, C extends object, R extends Route<ValidPath, P, C>> =
    R extends Route<infer Path, infer Props, infer Children>
        ? AddressFn<Props> & { [key in keyof Children]: AddressGroupChild<Children[key]> }
        : never;

export type RootAddressGroup<SC extends object, S extends Slash<SC>> =
    { [key in keyof S["routes"]]: AddressGroupChild<S["routes"][key]> };

export const buildPathString = <P extends object, C extends object>(r: Route<ValidPath, P, C>, props: P) => {
    const segs = r.path.path.map(x => {
        if (x.T === "str") {
            return x.seg;
        } else {
            const value = props[x.key as keyof typeof props]; // checked on route parsing pass

            if (value === null || value === undefined) {
                throw new Error("Prop value is null");
            }

            return x.codec.toString(value);
        }
    });

    const query = r.path.query.map(x => {
        const value = props[x.key as keyof typeof props]; // checked on route parsing pass

        if (value === null || value === undefined) {
            if (x.nullable)
                return undefined;
            else
                throw new Error("Prop value is null - " + x.key);
        }

        return x.key + "=" + x.codec.toString(value);
    }).filter(x => x !== undefined);

    if (query.length) {
        return "/" + segs.join("/") + "?" + query.join("&");
    } else {
        return "/" + segs.join("/");
    }
};

function makeAddress_<P extends object, C extends object, R extends Route<ValidPath, P, C>>(
    r: R
): AddressGroup<P, C, R> {
    // Required properties will be added later
    const pathFn: AddressGroup<P, C, R> = ((props: P) => buildPathString(r, props)) as never;
    pathFn.$unsafeRoute = r as UntypedRoute;

    for (const child in r.children) {
        pathFn[child as keyof C] = makeAddress_(r.children[child] as never) as never;
    }

    return pathFn;
}

export const makeAddress = <S extends Slash<C>, C extends object>(r: S): RootAddressGroup<C, S> => {
    const o = {} as RootAddressGroup<C, S>;

    for (const child in r.routes) {
        o[child as keyof S["routes"]] = makeAddress_(r.routes[child] as never) as never;
    }

    return o;
};