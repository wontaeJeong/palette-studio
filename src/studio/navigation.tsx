import React from "react";
import type { DesignSelection } from "../core/types";
import { Svg } from "./DemoBoundary";
export function Navigation({
  selection,
  interactive = false,
  active = "projects",
  onNavigate,
  className = "",
  orientation = "vertical",
  projectIcon = "layout-dashboard",
}: {
  selection: Pick<DesignSelection, "navigationStyle" | "navigationStructure">;
  interactive?: boolean;
  active?: string;
  onNavigate?: (page: string) => void;
  className?: string;
  orientation?: string;
  projectIcon?: string;
}) {
  const items = [
    { id: "projects", label: "프로젝트", group: "작업", icon: projectIcon },
    { id: "settings", label: "설정", group: "관리", icon: "settings" },
  ];
  const groups =
    selection.navigationStructure === "grouped"
      ? items.map((i) => [i])
      : [items];
  const Root = interactive ? "nav" : "span",
    Item = interactive ? "button" : "span";
  return (
    <Root
      className={"ps-navigation " + className}
      data-nav-style={selection.navigationStyle}
      data-nav-structure={selection.navigationStructure}
      data-nav-orientation={orientation}
      aria-label="프로젝트 메뉴"
    >
      {groups.map((group, i) => (
        <span className="ps-nav-group" key={i}>
          {selection.navigationStructure === "grouped" && (
            <span className="ps-nav-heading">{group[0].group}</span>
          )}
          {group.map((item) => (
            <Item
              key={item.id}
              className="ps-nav-item"
              type={interactive ? "button" : undefined}
              data-nav-page={interactive ? item.id : undefined}
              aria-label={item.label}
              aria-current={item.id === active ? "page" : undefined}
              onClick={interactive ? () => onNavigate?.(item.id) : undefined}
            >
              <span className="ps-nav-icon" aria-hidden="true">
                <Svg name={item.icon} />
              </span>
              <span className="ps-nav-label">{item.label}</span>
            </Item>
          ))}
        </span>
      ))}
    </Root>
  );
}
export function Shell({ selection }: { selection: DesignSelection }) {
  const nav = selection.navigation;
  return (
    <span
      className={"shell shell-layout-" + nav}
      data-menu-structure={selection.navigationStructure}
    >
      <span className="shell-top" hidden={nav === "left"}>
        <strong>프로젝트</strong>
        {nav === "top" ? (
          <Navigation selection={selection} orientation="horizontal" />
        ) : (
          <span>작업 공간</span>
        )}
      </span>
      <span className="shell-body">
        {nav !== "top" && (
          <span className="shell-side">
            <Navigation selection={selection} />
          </span>
        )}
        <span className="shell-content">
          <strong>프로젝트 목록</strong>
          <span className="shell-line" />
          <span className="shell-line" />
          <span className="mini-action">추가</span>
        </span>
      </span>
    </span>
  );
}
