/* Shared bounded framework-neutral sample bodies for catalog and React editor. */
(() => {
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
  const button = (text, action = "", primary = false) =>
    '<button type="button" class="sample-button ' +
    (primary
      ? "sample-primary sample-emphasis"
      : action === "cancel"
        ? ""
        : "sample-emphasis") +
    '"' +
    (action ? ' data-demo="' + action + '"' : "") +
    ">" +
    text +
    "</button>";
  function demo(id, variant, preview = false, pane = "light") {
    const uid =
      (preview === "inline" ? "inline-" : preview ? "preview-" : "detail-") +
      id +
      "-" +
      pane;
    const dashboard = window.PaletteDashboardDemos.render(id, variant, {uid, preview});
    if (dashboard !== null) return dashboard;

    const content = {
      button:
        '<div class="sample-actions">' +
        button("실행", "action", variant !== "outline") +
        button("취소", "cancel") +
        "</div>",
      input:
        '<label>이메일<input class="sample-input sample-emphasis" type="email" placeholder="hello@example.com"></label><small>이메일 주소를 입력하세요.</small>',
      select:
        '<label>프로젝트 상태<select class="sample-input sample-emphasis"><option>진행 중</option><option>검토 중</option><option>완료</option></select></label>',
      switch:
        '<label class="sample-check sample-emphasis"><input class="sample-switch" type="checkbox" role="switch" checked>이메일 알림 받기</label>',
      checkbox:
        '<label class="sample-check sample-emphasis"><input type="checkbox" checked>작업 알림</label><label class="sample-check sample-emphasis"><input type="checkbox">주간 요약</label>',
      toast: preview
        ? '<div class="sample-box sample-feedback">' +
          window.PaletteComponentDemos.icon("circle-check") +
          "<div><strong>변경 내용을 저장했습니다</strong><p>팀과 공유할 준비가 되었습니다.</p></div></div>"
        : '<div class="sample-actions">' +
          [
            ["success", "저장 완료"],
            ["info", "안내"],
            ["warning", "주의"],
            ["error", "오류"],
          ]
            .map(([status, label]) =>
              button(label, "toast", status === "success").replace(
                'data-demo="toast"',
                'data-demo="toast" data-toast-status="' + status + '"',
              ),
            )
            .join("") +
          '</div><p class="demo-hint" data-save-state>저장한 디자인을 알림에서 되돌릴 수 있습니다.</p><div class="sample-box sample-danger persistent-error" hidden><strong>동기화되지 않은 변경 내용</strong><p>연결을 확인한 후 다시 시도하세요. 작성한 내용은 보관됩니다.</p>' +
          button("다시 시도", "toast").replace(
            'data-demo="toast"',
            'data-demo="toast" data-toast-status="success"',
          ) +
          "</div>",
      popover: preview
        ? '<div class="sample-box"><h4>표시 설정</h4><p>완료한 프로젝트 포함</p><span class="sample-badge">설정 적용</span></div>'
        : button("표시 설정", "popover").replace(
            "<button ",
            '<button aria-haspopup="dialog" aria-expanded="false" ',
          ),
      alert:
        '<div class="sample-box sample-warning sample-feedback">' +
        window.PaletteComponentDemos.icon("triangle-alert") +
        '<div><strong>입력 확인 필요</strong><p>이메일 주소를 확인하고 다시 저장하세요.</p><a href="#detail-title">입력 기준 확인</a></div></div>',
      dialog: preview
        ? '<div class="sample-box"><h4 class="sample-emphasis">변경 내용을 저장할까요?</h4><p>작업 내용을 반영합니다.</p><div class="sample-actions"><span class="sample-badge">취소</span><span class="sample-badge sample-primary">저장</span></div></div>'
        : button("확인창 열기", "dialog", true),
      drawer: preview
        ? '<div class="sample-box sample-emphasis" style="margin-left:22%;width:78%;border-radius:0"><h4>프로젝트 상세</h4><p>프로젝트 상세 정보입니다.</p><div class="mini-line"></div></div>'
        : button("패널 열기", "drawer", true),
      tooltip:
        '<div class="sample-tooltip">' +
        button("도움말 보기", "tooltip").replace(
          "<button ",
          '<button aria-describedby="' + uid + '" ',
        ) +
        '<span id="' +
        uid +
        '" class="tip" role="tooltip"' +
        (preview ? " data-static-tip" : " hidden") +
        ">프로젝트 설정을 표시합니다.</span></div>",
      menu: preview
        ? '<div class="sample-box"><h4>프로젝트 동작</h4><p>이름 바꾸기</p><span>복제하기</span></div>'
        : button(
            "프로젝트 동작 " +
              window.PaletteComponentDemos.icon("chevron-down"),
            "menu",
          ).replace(
            "<button ",
            '<button aria-haspopup="menu" aria-expanded="false" ',
          ),
      tabs:
        '<div class="sample-tabs" role="tablist" aria-label="프로젝트 내용"><button type="button" class="sample-tab sample-emphasis" role="tab" id="' +
        uid +
        '-overview" aria-controls="' +
        uid +
        '-panel" aria-selected="true" data-tab="overview">개요</button><button type="button" class="sample-tab" role="tab" id="' +
        uid +
        '-activity" aria-controls="' +
        uid +
        '-panel" aria-selected="false" tabindex="-1" data-tab="activity">활동</button></div><div role="tabpanel" tabindex="0" id="' +
        uid +
        '-panel" aria-labelledby="' +
        uid +
        '-overview">프로젝트 개요입니다.</div>',
      breadcrumb:
        '<nav aria-label="현재 위치"><ol class="sample-crumbs"><li><a href="#sets">홈</a></li><li><a href="#encyclopedia-heading">프로젝트</a></li><li class="sample-emphasis" aria-current="page">상세</li></ol></nav>',
      pagination:
        '<nav class="sample-actions" aria-label="페이지"><button type="button" class="sample-button" data-page="prev" aria-label="이전 페이지" disabled>‹</button><span class="sample-badge sample-emphasis" aria-current="page" data-page-number>1 / 3</span><button type="button" class="sample-button" data-page="next" aria-label="다음 페이지">›</button></nav>',
      card: '<article class="sample-box"><h4 class="sample-emphasis">샘플 프로젝트</h4><p>담당 팀: Product Team</p><span class="sample-badge">멤버 3명</span></article>',
      badge:
        '<div class="sample-actions">' +
        [
          ["success", "circle-check", "완료"],
          ["review", "clock", "검토"],
          ["rejected", "circle-x", "거절"],
          ["failed", "triangle-alert", "실패"],
        ]
          .map(
            ([status, glyph, label]) =>
              '<span class="sample-badge sample-' +
              status +
              '">' +
              window.PaletteComponentDemos.icon(glyph) +
              label +
              "</span>",
          )
          .join("") +
        "</div>",
      accordion:
        '<details class="sample-box"><summary class="sample-emphasis">어떻게 시작하나요?</summary><p>세트를 고르고 프로젝트에 필요한 요소를 확인하세요.</p></details>',
      empty:
        '<div class="sample-empty"><span class="empty-symbol">' +
        window.PaletteComponentDemos.icon("folder-open") +
        '</span><strong class="sample-emphasis">등록된 프로젝트 없음</strong><p>프로젝트를 추가하면 목록에 표시됩니다.</p>' +
        button("프로젝트 만들기", "action", variant === "solid") +
        "</div>",
    }[id];
    // Static samples and interactive demos share the same markup and treatment.
    if (preview === "inline") return content.replace(/ data-demo="[^"]*"/g, "");
    const showSample =
      !preview &&
      ["toast", "dialog", "drawer", "tooltip", "menu", "popover"].includes(id);
    const body = showSample
      ? '<div class="inline-sample" inert aria-hidden="true">' +
        demo(id, variant, "inline", pane) +
        '</div><div class="sample-interaction">' +
        content +
        "</div>"
      : content;
    return '<div class="treatment ' + esc(variant) + '">' + body + "</div>";
  }

  window.PaletteSampleMarkup = { demo };
})();
