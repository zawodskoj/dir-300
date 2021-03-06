import { CodecMap } from "../types/codec";
import { ValidPath } from "../types/routes";
import { PathSeg, QuerySeg } from "../types/parsing";

const parseSeg = (seg: string, pmap: CodecMap, tmap: CodecMap): PathSeg => {
    if (seg === "")
        throw new Error("Failed to parse path: found empty segment");
    if (seg[0] === ":") {
        const ixOfOpeningBracket = seg.indexOf("[");

        if (ixOfOpeningBracket !== -1 && seg[seg.length - 1] === "]") {
            const qualifiedType = seg.substring(ixOfOpeningBracket + 1, seg.length - 1);
            const codec = tmap[qualifiedType];
            if (codec) {
                return { T: "prop", key: seg.substring(1, ixOfOpeningBracket), codec: codec };
            } else {
                throw new Error("Failed to parse path: could not find codec for qualified type " + qualifiedType);
            }
        } else if (ixOfOpeningBracket !== -1) {
            throw new Error("Failed to parse path: invalid type qualifier syntax");
        } else {
            const propName = seg.substr(1);
            const codec = pmap[propName];
            if (codec) {
                return { T: "prop", key: propName, codec: codec };
            } else {
                throw new Error("Failed to parse path: could not find codec for prop " + propName);
            }
        }
    } else {
        return { T: "str", seg: seg };
    }
};

const parseQuerySeg = (seg: string, pmap: CodecMap, tmap: CodecMap): QuerySeg<string, unknown, boolean> => {
    const ixOfOpeningBracket = seg.indexOf("[");
    const nullable = seg[seg.length - 1] === "?";
    const rbrOfs = nullable ? 2 : 1;

    if (ixOfOpeningBracket !== -1 && seg[seg.length - rbrOfs] === "]") {
        const qualifiedType = seg.substring(ixOfOpeningBracket + 1, seg.length - rbrOfs);
        const codec = tmap[qualifiedType];
        if (codec) {
            return { key: seg.substring(0, ixOfOpeningBracket), codec: codec, nullable };
        } else {
            throw new Error("Failed to parse path: could not find codec for qualified type " + qualifiedType);
        }
    } else if (ixOfOpeningBracket !== -1) {
        throw new Error("Failed to parse path: invalid type qualifier syntax");
    } else {
        const codec = pmap[nullable ? seg.substr(0, seg.length - 1) : seg];
        if (codec) {
            return { key: seg, codec: codec, nullable };
        } else {
            throw new Error("Failed to parse path: could not find codec for prop " + seg);
        }
    }
};

const parseQuery = (query: string, pmap: CodecMap, tmap: CodecMap): QuerySeg<string, unknown, boolean>[] => {
    const ixOfAmp = query.indexOf("&");

    if (ixOfAmp === -1) {
        return [parseQuerySeg(query, pmap, tmap)] as never;
    } else {
        return [
            parseQuerySeg(query.substring(0, ixOfAmp), pmap, tmap),
            ...parseQuery(query.substr(ixOfAmp + 1), pmap, tmap)
        ];
    }
};

const parsePathWithoutQuery = (path: string, pmap: CodecMap, tmap: CodecMap): PathSeg[] => {
    const ixOfSlash = path.indexOf("/");

    if (ixOfSlash === -1) {
        return [parseSeg(path, pmap, tmap)] as never;
    } else {
        return [
            parseSeg(path.substring(0, ixOfSlash), pmap, tmap),
            ...parsePathWithoutQuery(path.substr(ixOfSlash + 1), pmap, tmap)
        ] as never;
    }
};

export const parsePath = (path: string, pmap: CodecMap, tmap: CodecMap): ValidPath => {
    const ixOfQstartWithSlash = path.indexOf("/#");
    const ixOfQstartWithoutSlash = path.indexOf("#");

    if (ixOfQstartWithoutSlash === -1) {
        return { path: parsePathWithoutQuery(path, pmap, tmap), query: [] } as never;
    } else {
        const ixOfQstart = ixOfQstartWithSlash === -1 ? ixOfQstartWithoutSlash : ixOfQstartWithSlash;
        const skip = ixOfQstartWithSlash === -1 ? 1 : 2;

        const p = parsePathWithoutQuery(path.substring(0, ixOfQstart), pmap, tmap);
        const q = parseQuery(path.substr(ixOfQstart + skip), pmap, tmap);
        return { path: p, query: q } as never;
    }
};