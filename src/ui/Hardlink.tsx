import React, { CSSProperties, FC } from "react";
import { useNav } from ".";
import { PathString } from "../dsl";

interface HardlinkProps {
    to: PathString
    className?: string
    style?: CSSProperties
    noDecoration?: boolean
}

export const Hardlink: FC<HardlinkProps> = x => {
    const nav = useNav();
    const data = nav.store.use();

    if (!nav) return <a>{ x.children }</a>;

    const noDecoration: CSSProperties = x.noDecoration
        ? { textDecoration: "none", color: "initial" }
        : {};

    return <a href={"#" + data.path}
              className={x.className}
              style={{ ...x.style, ...noDecoration }}
              onClick={e => {
                  e.preventDefault();
                  nav.go(x.to);
              }}>
        { x.children }
    </a>;
};
