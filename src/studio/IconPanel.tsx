import React, { useState } from "react";
import { useStudio } from "./context";
import { icons } from "./data";
import { Svg } from "./DemoBoundary";
export function IconPanel() {
  const { config, update } = useStudio(),
    [query, setQuery] = useState(""),
    list = icons.filter((i) =>
      (i.name + " " + i.label + " " + i.category)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    );
  return (
    <details id="icons-options" className="inspector-section">
      <summary>
        <span>아이콘</span>
        <small id="workspace-icon-count">{config.icons.length}개 선택</small>
      </summary>
      <div className="details-content">
        <p className="help">아이콘을 최대 24개 선택할 수 있습니다.</p>
        <label>
          아이콘 검색
          <input
            id="workspace-icon-search"
            type="search"
            placeholder="이름 또는 용도 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div id="workspace-icons" className="workspace-icons">
          {list.length ? (
            list.map((i) => (
              <label key={i.name} className="icon-option">
                <input
                  type="checkbox"
                  data-select-icon={i.name}
                  checked={config.icons.includes(i.name)}
                  disabled={
                    config.icons.length >= 24 && !config.icons.includes(i.name)
                  }
                  onChange={(e) =>
                    update({
                      icons: e.target.checked
                        ? [...config.icons, i.name]
                        : config.icons.filter((n) => n !== i.name),
                    })
                  }
                />
                <Svg name={i.name} />
                <span>
                  {i.label}
                  <small>{i.name}</small>
                </span>
              </label>
            ))
          ) : (
            <p className="help">검색 결과가 없습니다.</p>
          )}
        </div>
        <p id="icon-selection-status" className="help" role="status">
          {config.icons.length >= 24
            ? "24개를 선택했습니다. 다른 아이콘을 고르려면 선택한 아이콘을 먼저 해제하세요."
            : ""}
        </p>
      </div>
    </details>
  );
}
