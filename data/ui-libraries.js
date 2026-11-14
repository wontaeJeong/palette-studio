/* Selectable runtimes and pure integration recipes. No network on load. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./library-sources.js'):root.PaletteLibrarySources,node?require('./design-concepts.js'):root.PaletteDesignConcepts);
  if(node) module.exports=api; else root.PaletteUILibraries=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(sources,concepts){
  'use strict';
  const libraries=[
    {id:'vanilla',name:'기존 UI · Vanilla',description:'현재 앱의 컴포넌트를 유지합니다. 새 React 런타임 없이 토큰과 디자인 기준만 적용합니다.',repo:null,npmPackage:null,docs:'docs/INTEGRATION.md',runtime:'native',version:null},
    {id:'base-ui',name:'Base UI',description:'접근성 동작은 라이브러리에 맡기고 형태는 직접 설계할 때. 스타일을 자유롭게 정할 수 있습니다.',repo:'mui/base-ui',npmPackage:'@base-ui/react',docs:'https://base-ui.com/react/overview/quick-start',runtime:'react',version:'1.9.0'},
    {id:'radix',name:'Radix Primitives',description:'기존 CSS와 세밀한 조합에 적합합니다. Button은 네이티브이며 알림은 Sonner를 사용합니다.',repo:'radix-ui/primitives',npmPackage:'@radix-ui/react-dialog',docs:'https://www.radix-ui.com/primitives/docs/overview/introduction',runtime:'react',version:'1.3.1',monorepo:true},
    {id:'react-aria',name:'React Aria',description:'키보드와 보조기기 동작을 세밀하게 다룹니다. 무스타일 컴포넌트와 Sonner 알림을 조합합니다.',repo:'adobe/react-spectrum',npmPackage:'react-aria-components',docs:'https://react-aria.adobe.com/',runtime:'react',version:'1.22.1',monorepo:true},
    {id:'mui',name:'MUI · Material UI',description:'풍부한 기본 컴포넌트와 일관된 제품 UI가 필요할 때. 기존 ThemeProvider에 선택 토큰을 병합합니다.',repo:'mui/material-ui',npmPackage:'@mui/material',docs:'https://mui.com/material-ui/',runtime:'react',version:'9.5.0',monorepo:true},
    {id:'mantine',name:'Mantine',description:'앱 UI와 훅을 함께 구성할 때. 자체 Provider와 Notifications를 사용합니다.',repo:'mantinedev/mantine',npmPackage:'@mantine/core',docs:'https://mantine.dev/',runtime:'react',version:'9.8.0',monorepo:true}
  ];
  const references=[
    {id:'shadcn',name:'shadcn/ui · 복사 레시피',description:'독립 런타임이 아닙니다. Base UI 또는 Radix를 선택하고 복사한 컴포넌트를 직접 관리하세요.',repo:'shadcn-ui/ui',npmPackage:'shadcn',docs:'https://ui.shadcn.com/',runtime:'recipe',packageLabel:'CLI downloads',monorepo:true},
    {id:'sonner',name:'Sonner · 알림 보조',description:'Radix와 React Aria 예시에 사용하는 실제 알림 런타임입니다.',repo:'emilkowalski/sonner',npmPackage:'sonner',docs:'https://sonner.emilkowal.ski/',runtime:'companion',version:'2.0.8'}
  ];
  const packages={
    'base-ui':{'@base-ui/react':'1.9.0'},
    radix:{'@radix-ui/react-dialog':'1.3.1','@radix-ui/react-popover':'1.3.1','@radix-ui/react-tooltip':'1.4.1',sonner:'2.0.8'},
    'react-aria':{'react-aria-components':'1.22.1',sonner:'2.0.8'},
    mui:{'@mui/material':'9.5.0','@emotion/react':'11.14.0','@emotion/styled':'11.14.1'},
    mantine:{'@mantine/core':'9.8.0','@mantine/hooks':'9.8.0','@mantine/notifications':'9.8.0'}
  };
  function normalize(id){if(id===undefined)return 'vanilla';if(!libraries.some(l=>l.id===id))throw Error('Invalid uiLibrary: '+id);return id;}
  function get(id){return libraries.find(l=>l.id===normalize(id));}
  function summary(config){
    const library=get(config.uiLibrary);
    const scope=config.scope==='dark-only'?'다크 색상만 적용합니다.':config.scope==='light-only'?'라이트 색상만 적용합니다.':'라이트·다크 색상을 적용합니다.';
    const runtime=library.runtime==='native'?'현재 컴포넌트를 유지합니다.':config.framework==='astro'?'Astro React island가 필요합니다.':config.framework==='vanilla'?'React root와 번들이 필요합니다.':'React 런타임이 필요합니다.';
    const existing=config.target==='existing-app'?' 기존 앱의 라이브러리와 Provider를 우선 유지하세요.':'';
    return library.name+' · '+scope+' '+runtime+existing+' 자세한 적용 방법은 library-README.md를 확인하세요.';
  }
  function recipe(config,catalog){
    const id=normalize(config.uiLibrary),library=get(id),notes=[
      'For an existing application, preserve its existing library and ThemeProvider first. This selection is a comparison/reference, not authorization to replace components.',
      'Merge only '+config.scope+' colors into the canonical theme; preserve excluded modes and existing selectors.',
      'Load selected-fonts.css for body/code roles. Body: '+config.fonts.body+'; code: '+config.fonts.code+'.'
    ];
    const files={};
    if(id==='vanilla'){
      notes.push('No React runtime is required. Use selected-theme.css, selected-style.css and the existing native components.');
      files['library-README.md']='# Existing UI / Vanilla\n\n'+notes.join('\n\n')+'\n';return {files,notes};
    }
    notes.push('React 19.3.1 and react-dom 19.3.1 runtime required. For Astro use an @astrojs/react island with client:load; a vanilla HTML target must intentionally add a bundled React root/runtime. This preview choice does not change the target framework.');
    notes.push('The preview and exported adapter use actual '+library.name+' components. Generic project and catalog previews remain framework-neutral.');
    if(id==='radix'||id==='react-aria')notes.push('Toast is Sonner 2.0.8 (explicit companion); React Aria Toast is not used because its API is alpha. Radix Primitives has no styled Button: the native button is used through real library triggers.');
    const palette=catalog.palettes.find(p=>p.id===config.palette),style=catalog.styles.find(s=>s.id===config.style);
    const modes={};
    for(const mode of ['light','dark'])if(config.scope==='both'||config.scope===mode+'-only')modes[mode]=palette.modes[mode];
    const concept=concepts.get(config.designSelection?.concept||'minimal');
    const choices={library:id,concept:concept.id,style:config.style,fonts:config.fonts,shape:concept.tokens,density:style};
    files['library-theme.ts']='/* Selected HEX branches only. Merge into your existing theme; never recreate an excluded mode. */\nexport const modes = '+JSON.stringify(modes,null,2)+' as const;\nexport const selection = '+JSON.stringify(choices,null,2)+' as const;\nexport function applyLibraryTokens<T extends Record<string,string>>(existing:T, mode:"light"|"dark") {\n  const selected = (modes as Partial<Record<string,Record<string,string>>>)[mode];\n  if (!selected) return existing;\n  return {...existing, ...selected};\n}\n';
    files['library-shared.tsx']=sources.shared;
    files['library-adapter.tsx']=sources[id].replaceAll("'./shared'","'./library-shared'");
    files['library-components.tsx']="import React from 'react';\nimport { Adapter } from './library-adapter';\nimport { ScopedPreview, type PreviewOptions } from './library-shared';\nimport { modes, selection } from './library-theme';\nimport './library.css';\n\n// A standalone comparison sample. Reuse your existing Provider for a production integration.\nexport function SelectedLibraryPreview({mode}:{mode:'light'|'dark'}) {\n  const tokens = (modes as Partial<Record<string,Record<string,string>>>)[mode];\n  if (!tokens) return null; // excluded mode remains owned by the existing app\n  const options: PreviewOptions = {...selection, theme:mode, tokens};\n  return <ScopedPreview options={options} Adapter={Adapter}/>;\n}\n";
    files['library.css']=sources.css;
    const dependencies={react:'19.3.1','react-dom':'19.3.1',...packages[id]};
    files['library-packages.json']=JSON.stringify({private:true,dependencies},null,2)+'\n';
    notes.push('Install the exact dependencies from library-packages.json into your existing manifest; keep your app scripts. Import selected-fonts.css plus library.css. The adapter owns a portal container with selected HEX, font and concept variables; do not move portals outside that scope. Each mounted preview owns its toast store/ID. Unmount it to remove portals and timers.');
    notes.push('Shape, spacing and hierarchy: '+concept.name+'; style '+style.id+' ('+style.radius+' radius, '+style.gap+' gap). Explicit selected fonts take precedence. Respect prefers-reduced-motion.');
    notes.push('Tested package versions are pinned above; current GitHub releases and npm downloads are separate adoption signals. All preview dependencies are locally bundled with third-party notices in assets/library-preview-LICENSES.txt.');
    if(id==='mui')notes.push('MUI uses createTheme without CssBaseline. Map existing palette/text/background/action roles in its canonical ThemeProvider; the adapter demonstrates the selected mode.');
    if(id==='mantine')notes.push('Mantine uses a scoped cssVariablesSelector and actual per-preview notifications store. Avoid global resets; retain your existing MantineProvider in an existing app.');
    if(id==='base-ui'||id==='radix'){
      let css='/* shadcn/ui is a copied-component recipe for '+library.name+', not an npm runtime named shadcn/ui. */\n';
      const mapping={background:'--color-canvas',foreground:'--color-ink',card:'--color-surface','card-foreground':'--color-ink',popover:'--color-raised','popover-foreground':'--color-ink',primary:'--color-accent','primary-foreground':'--color-on-accent',secondary:'--color-surface-soft','secondary-foreground':'--color-ink',muted:'--color-surface-soft','muted-foreground':'--color-ink-muted',accent:'--color-accent-subtle','accent-foreground':'--color-ink',destructive:'--color-danger',border:'--color-line',input:'--color-line-strong',ring:'--color-focus'};
      for(const [mode,tokens] of Object.entries(modes))css+=':root[data-theme="'+mode+'"] {\n'+Object.entries(mapping).map(([name,key])=>{if(!/^#[0-9a-fA-F]{6}$/.test(tokens[key]))throw Error('Missing literal HEX mapping: '+key);return '  --'+name+': '+tokens[key]+';'}).join('\n')+'\n  --radius: '+concept.tokens.radius+';\n}\n';
      files['shadcn-tokens.css']=css;
      notes.push('shadcn mapping: import shadcn-tokens.css only in a project that owns copied Base UI/Radix components. Map your Tailwind @theme colors to these variables, use background:var(--background) directly, and remove old hsl(var(...)) wrappers. Preserve the copied component licenses; the shadcn CLI is not an installed component runtime.');
    }
    files['library-README.md']='# '+library.name+' integration\n\n'+notes.join('\n\n')+'\n\nOfficial docs: '+library.docs+'\nSource: https://github.com/'+library.repo+'\n';
    return {files,notes};
  }
  return {libraries,references,packages,get,normalize,summary,recipe};
});
