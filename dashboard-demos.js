/* Fixed sample data and accessible, dependency-free dashboard previews. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./data/dashboard-components.js"));
  else root.PaletteDashboardDemos = factory(root.PaletteDashboardComponents);
})(typeof globalThis !== "undefined" ? globalThis : this, function (catalog) {
  "use strict";
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const periods = ["1주", "2주", "3주", "4주", "5주", "6주"];
  const opened = [24, 38, 32, 56, 48, 72],
    completed = [16, 27, 22, 38, 34, 54];
  const color = (n) => `var(--color-chart-${n})`;
  const text = (x, y, value, extra = "") =>
    `<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
  const rect = (x, y, width, height, fill, extra = "") =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
  const point = (x, y, fill, r = 4) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  function axes(labels, max = 80) {
    return (
      [0, max / 2, max]
        .map((v) => {
          const y = 160 - (v / max) * 120;
          return (
            `<path d="M32 ${y}H310" class="dashboard-gridline"/>` +
            text(27, y + 4, v, 'text-anchor="end"')
          );
        })
        .join("") +
      labels
        .map((v, i) => text(55 + i * 46, 183, v, 'text-anchor="middle"'))
        .join("") +
      text(32, 18, "건")
    );
  }
  function dataTable(title, headers, rows) {
    return `<details class="dashboard-data"><summary>데이터 표</summary><div class="dashboard-table-scroll" tabindex="0" role="region" aria-label="${esc(title)} 데이터"><table><caption>${esc(title)} · 샘플 데이터</caption><thead><tr>${headers.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x, i) => (i ? `<td>${esc(x)}</td>` : `<th scope="row">${esc(x)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div></details>`;
  }
  function legend(items) {
    return `<ul class="dashboard-legend">${items.map((item, i) => `<li><i style="background:${color(i + 1)}" aria-hidden="true"></i><span>${esc(item)}</span></li>`).join("")}</ul>`;
  }
  function chart(id, title) {
    let drawing = "",
      key = "",
      headers = ["기간", "등록 (건)"],
      rows = periods.map((p, i) => [p, opened[i]]),
      note = "6주간 작업 수 · 샘플";
    if (["bar-chart", "stacked-bar", "histogram"].includes(id)) {
      const histogram = id === "histogram",
        stacked = id === "stacked-bar";
      const labels = histogram ? ["0–2", "2–4", "4–6", "6–8", "8–10"] : periods;
      const values = histogram ? [12, 36, 60, 42, 18] : opened;
      drawing = axes(labels, stacked ? 140 : 80);
      drawing += values
        .map((v, i) => {
          const x = histogram ? 33 + i * 55 : 39 + i * 46,
            width = histogram ? 54 : 32,
            scale = stacked ? 120 / 140 : 1.5,
            h = v * scale;
          let bar = rect(x, 160 - h, width, h, color(1));
          if (stacked) {
            const extra = completed[i] * scale;
            bar += rect(x, 160 - h - extra, width, extra, color(2));
            return (
              bar +
              text(
                x + width / 2,
                154 - h - extra,
                v + completed[i],
                'text-anchor="middle"',
              )
            );
          }
          return bar + text(x + width / 2, 154 - h, v, 'text-anchor="middle"');
        })
        .join("");
      if (histogram) {
        // Equal-width, contiguous bins; label centers match the rectangles.
        drawing = drawing.replace(
          /<text x="\d+" y="183"[^>]*>.*?<\/text>/g,
          "",
        );
        drawing += labels
          .map((v, i) => text(60 + i * 55, 183, v, 'text-anchor="middle"'))
          .join("");
        headers = ["소요 시간 (시간)", "작업 수 (건)"];
        rows = labels.map((v, i) => [v, values[i]]);
        note = "소요 시간 분포 · 구간 끝 미포함, 마지막 10시간 포함";
      } else if (stacked) {
        headers = ["기간", "등록 (건)", "완료 (건)", "합계 (건)"];
        rows = periods.map((p, i) => [
          p,
          opened[i],
          completed[i],
          opened[i] + completed[i],
        ]);
        key = legend(["등록", "완료"]);
        note = "등록·완료 이벤트 수 · 합계 표시";
      }
    } else if (["line-chart", "area-chart", "sparkline"].includes(id)) {
      drawing = axes(periods);
      const points = opened
        .map((v, i) => `${55 + i * 46},${160 - v * 1.5}`)
        .join(" ");
      if (id === "area-chart")
        drawing += `<polygon points="55,160 ${points} 285,160" fill="var(--color-heatmap-2)"/>`;
      drawing += `<polyline points="${points}" fill="none" stroke="${color(1)}" stroke-width="3"/>`;
      drawing += opened
        .map(
          (v, i) =>
            point(55 + i * 46, 160 - v * 1.5, color(1)) +
            text(55 + i * 46, 150 - v * 1.5, v, 'text-anchor="middle"'),
        )
        .join("");
      if (id === "line-chart") {
        drawing += `<polyline points="${completed.map((v, i) => `${55 + i * 46},${160 - v * 1.5}`).join(" ")}" fill="none" stroke="${color(2)}" stroke-width="3" stroke-dasharray="6 4"/>`;
        drawing += completed
          .map((v, i) => rect(52 + i * 46, 157 - v * 1.5, 6, 6, color(2)))
          .join("");
        key = legend(["● 등록 · 실선", "■ 완료 · 점선"]);
        headers.push("완료 (건)");
        rows = periods.map((p, i) => [p, opened[i], completed[i]]);
      }
      if (id === "sparkline") note = "최근 6주 · 현재 72건";
    } else if (id === "donut-chart" || id === "pie-chart") {
      const values = [48, 32, 20],
        labels = ["제품팀", "디자인팀", "개발팀"];
      let start = -Math.PI / 2;
      drawing = values
        .map((v, i) => {
          const end = start + (v / 100) * Math.PI * 2,
            x1 = 160 + 72 * Math.cos(start),
            y1 = 98 + 72 * Math.sin(start),
            x2 = 160 + 72 * Math.cos(end),
            y2 = 98 + 72 * Math.sin(end);
          const slice = `<path d="M160 98L${x1} ${y1}A72 72 0 ${v > 50 ? 1 : 0} 1 ${x2} ${y2}Z" fill="${color(i + 1)}" stroke="var(--color-raised)" stroke-width="2"/>`;
          start = end;
          return slice;
        })
        .join("");
      if (id === "donut-chart")
        drawing +=
          `<circle cx="160" cy="98" r="44" fill="var(--color-raised)"/>` +
          text(160, 96, "100", 'text-anchor="middle" class="dashboard-total"') +
          text(160, 115, "전체 작업", 'text-anchor="middle"');
      key = legend(labels.map((v, i) => `${v} ${values[i]}건 (${values[i]}%)`));
      headers = ["팀", "작업 수 (건)", "비율"];
      rows = labels.map((v, i) => [v, values[i], values[i] + "%"]);
      note = "팀별 작업 구성 · 전체 100건";
    } else if (id === "scatter-chart") {
      const hours = [2, 4, 3, 6, 5, 8];
      drawing = axes(["0", "2", "4", "6", "8", "10"]);
      drawing += hours
        .map(
          (v, i) =>
            point(55 + v * 23, 160 - opened[i] * 1.5, color(1), 5) +
            text(
              55 + v * 23 + 8,
              157 - opened[i] * 1.5,
              String.fromCharCode(65 + i),
            ),
        )
        .join("");
      headers = ["표본", "소요 시간 (시간)", "처리 수 (건)"];
      rows = hours.map((v, i) => [String.fromCharCode(65 + i), v, opened[i]]);
      note = "가로: 소요 시간 (시간) · 세로: 처리 수 (건)";
    } else if (id === "heatmap") {
      const values = [
          [12, 28, 45, 70],
          [32, 56, 82, 94],
          [8, 38, 64, 78],
        ],
        labels = ["월", "화", "수"];
      drawing = ["오전", "정오", "오후", "저녁"]
        .map((v, i) => text(78 + i * 64, 19, v, 'text-anchor="middle"'))
        .join("");
      drawing += values
        .map(
          (row, y) =>
            text(29, 60 + y * 48, labels[y], 'text-anchor="end"') +
            row
              .map((v, x) => {
                const level = Math.min(5, Math.floor(v / 20) + 1);
                return (
                  rect(
                    48 + x * 64,
                    31 + y * 48,
                    60,
                    43,
                    `var(--color-heatmap-${level})`,
                    'rx="3"',
                  ) +
                  text(
                    78 + x * 64,
                    58 + y * 48,
                    v,
                    `text-anchor="middle" style="fill:var(--color-on-heatmap-${level})"`,
                  )
                );
              })
              .join(""),
        )
        .join("");
      key = `<ul class="dashboard-legend">${["0–19", "20–39", "40–59", "60–79", "80–100"].map((v, i) => `<li><i style="background:var(--color-heatmap-${i + 1})" aria-hidden="true"></i>${v}</li>`).join("")}</ul>`;
      headers = ["요일", "오전", "정오", "오후", "저녁"];
      rows = labels.map((v, i) => [v, ...values[i]]);
      note = "시간대별 처리 수 (건) · 0–100";
    } else return null;
    return `<figure class="dashboard-chart"><svg viewBox="0 0 320 196" role="img" aria-label="${esc(title + " · " + note)}"><title>${esc(title + " · 수치는 아래 데이터 표에서 확인")}</title>${drawing}</svg><figcaption>${esc(note)}</figcaption>${key}${dataTable(title, headers, rows)}</figure>`;
  }
  function progress(circular = false) {
    return `<div class="dashboard-progress ${circular ? "is-circular" : ""}"><div role="progressbar" aria-label="작업 완료율" aria-valuemin="0" aria-valuemax="100" aria-valuenow="68">${circular ? '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="progress-track" cx="60" cy="60" r="46"/><circle class="progress-fill" cx="60" cy="60" r="46" pathLength="100" stroke-dasharray="68 100"/></svg>' : '<span style="width:68%"></span>'}</div><p><strong>68%</strong><span>완료 · 100개 중 68개</span></p></div>`;
  }
  function table() {
    const rows = [
      ["웹사이트 리뉴얼", "제품팀", 72],
      ["디자인 가이드", "디자인팀", 100],
      ["모바일 프로젝트", "개발팀", 45],
    ];
    return `<label>프로젝트 검색<input type="search" class="sample-input" data-table-search placeholder="프로젝트 이름"/></label><div class="dashboard-table-scroll" tabindex="0" role="region" aria-label="프로젝트 표"><table><caption>팀별 프로젝트 진행률</caption><thead><tr><th scope="col">프로젝트</th><th scope="col">팀</th><th scope="col" aria-sort="none"><button class="dashboard-sort" type="button" data-table-sort>진행률 ↕</button></th></tr></thead><tbody>${rows.map(([name, team, value]) => `<tr data-value="${value}"><th scope="row">${name}</th><td>${team}</td><td>${value}%</td></tr>`).join("")}</tbody></table></div><p data-table-empty role="status" hidden>검색 결과가 없습니다.</p>`;
  }
  function render(id, variant, { uid = "sample", preview = false } = {}) {
    const item = catalog.components.find((c) => c.id === id);
    if (!item) return null;
    const key = esc(uid),
      chartHTML = chart(id, item.label);
    let content = chartHTML;
    if (content === null)
      switch (id) {
        case "metric":
          content =
            '<div class="dashboard-metric"><strong>1,248<span>건</span></strong><p>↑ 12.8% 증가 <span>지난주 대비</span></p></div>';
          break;
        case "progress":
          content = progress();
          break;
        case "circular-progress":
          content = progress(true);
          break;
        case "stepper":
          content =
            '<ol class="dashboard-steps"><li aria-current="step">1. 준비 · 현재</li><li>2. 검토 · 예정</li><li>3. 완료 · 예정</li></ol><div class="sample-actions"><button type="button" class="sample-button" data-step-prev disabled>이전 단계</button><button type="button" class="sample-button" data-step-next>다음 단계</button></div><p class="dashboard-step-status" role="status">현재 1 / 3단계</p>';
          break;
        case "skeleton":
          content =
            '<div aria-busy="true" aria-label="프로젝트 목록 로딩"><div class="dashboard-skeleton" aria-hidden="true"><i></i><i></i><i></i></div></div><p role="status">프로젝트 목록을 불러오는 중…</p>';
          break;
        case "spinner":
          content =
            '<div class="dashboard-loading"><span class="dashboard-spinner" aria-hidden="true"></span><span role="status">데이터를 불러오는 중…</span></div>';
          break;
        case "error-state":
          content =
            '<div class="dashboard-error"><strong>! 데이터를 불러오지 못했습니다.</strong><p>연결 상태를 확인하고 다시 시도하세요.</p></div><button type="button" class="sample-button" data-retry>샘플 재시도</button><p data-retry-status role="status">샘플 오류 상태입니다.</p>';
          break;
        case "radio":
          content = `<fieldset><legend>알림 주기</legend><label class="sample-check"><input type="radio" name="${key}-frequency" value="daily" checked/>매일</label><label class="sample-check"><input type="radio" name="${key}-frequency" value="weekly"/>매주</label></fieldset>`;
          break;
        case "textarea":
          content =
            '<label>프로젝트 설명<textarea class="sample-input" rows="3" placeholder="목적과 작업 내용을 입력하세요"></textarea></label>';
          break;
        case "slider":
          content = `<label for="${key}-range">알림 음량</label><input id="${key}-range" type="range" min="0" max="100" step="1" value="40" data-dashboard-range/><output for="${key}-range">40%</output>`;
          break;
        case "date-picker":
          content =
            '<label>프로젝트 마감일<input class="sample-input" type="date" value="2026-11-30"/></label>';
          break;
        case "file-upload":
          content = `<label>첨부 파일<input class="sample-input" type="file" accept=".csv,.txt" data-dashboard-file aria-describedby="${key}-file-hint"/></label><small id="${key}-file-hint">CSV 또는 TXT · 선택만 미리보기</small><p data-file-status role="status">선택한 파일이 없습니다.</p>`;
          break;
        case "combobox":
          content = `<label>담당 팀<input class="sample-input" list="${key}-teams" placeholder="팀 이름 입력" aria-describedby="${key}-team-hint"/></label><small id="${key}-team-hint">목록에서 고르거나 직접 입력할 수 있습니다.</small><datalist id="${key}-teams"><option value="제품팀"></option><option value="디자인팀"></option><option value="개발팀"></option></datalist>`;
          break;
        case "data-table":
          content = table();
          break;
        case "avatar":
          content =
            '<div class="dashboard-person"><span class="dashboard-avatar" aria-hidden="true">김</span><div><strong>김민수</strong><p>제품팀 · 활동 중</p></div></div>';
          break;
        case "timeline":
          content =
            '<ol class="dashboard-timeline"><li><strong>✓ 프로젝트 생성</strong><time datetime="2026-11-12T09:00:00+09:00">11월 12일 09:00</time></li><li><strong>✓ 초안 등록</strong><time datetime="2026-11-13T14:30:00+09:00">11월 13일 14:30</time></li><li><strong>◷ 검토 요청</strong><time datetime="2026-11-14T10:00:00+09:00">11월 14일 10:00</time></li></ol>';
          break;
        case "list":
          content =
            '<ul class="dashboard-list"><li><strong>프로젝트 기획</strong><span>제품팀 · 완료</span></li><li><strong>화면 디자인</strong><span>디자인팀 · 진행 중</span></li><li><strong>접근성 검토</strong><span>개발팀 · 예정</span></li></ul>';
          break;
        case "separator":
          content =
            '<p>프로젝트 정보</p><hr class="dashboard-separator"/><p>담당 팀과 일정</p>';
          break;
      }
    return `<div class="treatment ${esc(variant)}" data-dashboard-demo="${esc(id)}"><article class="sample-box dashboard-sample"><h4 class="sample-emphasis">${esc(item.label)}</h4>${content}</article></div>`;
  }
  const bound = new WeakSet();
  function bind(root) {
    if (bound.has(root)) return;
    bound.add(root);
    root.addEventListener("input", (event) => {
      const target = event.target,
        sample = target.closest("[data-dashboard-demo]");
      if (!sample) return;
      if (target.matches("[data-dashboard-range]"))
        sample.querySelector("output").textContent = target.value + "%";
      if (target.matches("[data-table-search]")) {
        let shown = 0;
        for (const row of sample.querySelectorAll("tbody tr")) {
          row.hidden = !row.textContent
            .toLocaleLowerCase()
            .includes(target.value.trim().toLocaleLowerCase());
          if (!row.hidden) shown++;
        }
        sample.querySelector("[data-table-empty]").hidden = shown !== 0;
      }
    });
    root.addEventListener("change", (event) => {
      const target = event.target,
        sample = target.closest("[data-dashboard-demo]");
      if (!sample) return;
      if (target.matches("[data-dashboard-file]"))
        sample.querySelector("[data-file-status]").textContent = target.files
          .length
          ? `${target.files[0].name} · 선택됨 (전송하지 않음)`
          : "선택한 파일이 없습니다.";
    });
    root.addEventListener("click", (event) => {
      const target = event.target.closest("button"),
        sample = target?.closest("[data-dashboard-demo]");
      if (!sample) return;
      if (target.matches("[data-table-sort]")) {
        const header = target.closest("th"),
          ascending = header.getAttribute("aria-sort") !== "ascending",
          body = sample.querySelector("tbody");
        [...body.rows]
          .sort(
            (a, b) =>
              (Number(a.dataset.value) - Number(b.dataset.value)) *
              (ascending ? 1 : -1),
          )
          .forEach((row) => body.append(row));
        header.setAttribute(
          "aria-sort",
          ascending ? "ascending" : "descending",
        );
        target.textContent = "진행률 " + (ascending ? "↑" : "↓");
      }
      if (target.matches("[data-step-next],[data-step-prev]")) {
        const list = [...sample.querySelectorAll(".dashboard-steps li")],
          current = list.findIndex((li) => li.hasAttribute("aria-current")),
          next = Math.max(
            0,
            Math.min(
              2,
              current + (target.hasAttribute("data-step-next") ? 1 : -1),
            ),
          );
        list.forEach((li, i) => {
          li.textContent = `${i + 1}. ${["준비", "검토", "완료"][i]} · ${i < next ? "완료" : i === next ? "현재" : "예정"}`;
          if (i === next) li.setAttribute("aria-current", "step");
          else li.removeAttribute("aria-current");
        });
        sample.querySelector("[data-step-prev]").disabled = next === 0;
        sample.querySelector("[data-step-next]").disabled = next === 2;
        sample.querySelector("[role=status]").textContent =
          `현재 ${next + 1} / 3단계`;
      }
      if (target.matches("[data-retry]")) {
        sample.querySelector(".dashboard-error").hidden = true;
        sample.querySelector("[data-retry-status]").textContent =
          "샘플 데이터를 불러왔습니다.";
        target.textContent = "다시 불러오기";
      }
    });
  }
  return { render, bind };
});
