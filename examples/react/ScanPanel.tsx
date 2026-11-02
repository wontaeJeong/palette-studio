import { useId, useState } from 'react';
import { useTheme } from './ThemeProvider';

// Import the selected palette once in the app entry. See ../tailwind/app.css for Tailwind.
export function ScanPanel() {
  const { preference, setPreference } = useTheme();
  const fieldId = useId();
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="cp-scope ui-card ui-stack" data-style="operational">
      <div className="ui-row">
        <h2>새 반입 검사</h2>
        <label htmlFor={`${fieldId}-theme`}>테마</label>
        <select id={`${fieldId}-theme`} className="ui-input" value={preference} onChange={e => setPreference(e.target.value as 'light' | 'dark' | 'system')}>
          <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
        </select>
      </div>
      <form className="ui-stack" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
        <div className="ui-field"><label htmlFor={fieldId}>저장소 주소</label><input id={fieldId} className="ui-input" type="url" required placeholder="https://git.example/team/mcp" /></div>
        <div className="ui-row"><button className="ui-btn ui-btn-primary" type="submit">검사 요청</button><button className="ui-btn" type="reset" onClick={() => setSubmitted(false)}>초기화</button></div>
        <p className="ui-muted" role="status">{submitted ? '✓ 샘플 요청을 확인했습니다.' : '실제 API에 연결하지 않은 컴포넌트 예제입니다.'}</p>
      </form>
    </section>
  );
}
