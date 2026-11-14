import React, {createContext, useContext, useId, useLayoutEffect, useState} from 'react';
export type PreviewOptions = {
  library:string; theme:'light'|'dark'; palette?:string; concept:string; style?:string;
  tokens:Record<string,string>; shape?:Record<string,string|number>;
  density?:{radius?:string;card?:string;padding?:string;height?:string;gap?:string;font?:string};
  fonts?:{body?:string;code?:string;source?:string;bodyFamily?:string;codeFamily?:string};
};
type Scope={options:PreviewOptions; portal:HTMLDivElement; id:string};
const Context=createContext<Scope|null>(null);
export function useScope(){const value=useContext(Context);if(!value)throw Error('Missing library scope');return value;}
export const mark=(kind:string)=>({'data-library-component':kind});
export const trigger=(kind:string)=>({'data-library-trigger':kind,'data-concept-part':'control'});
export const copy={title:'프로젝트 준비 완료',description:'선택한 디자인을 팀과 공유할 수 있습니다.',tooltip:'프로젝트 설정을 확인하세요.',popover:'프로젝트 정보',toast:'✓ 변경 사항을 저장했습니다',detail:'팀의 최신 설정에 반영되었습니다.'};
export function scopeStyle(options:PreviewOptions){
 const style:Record<string,string|number>={...options.tokens,fontFamily:options.fonts?.bodyFamily||'var(--kit-font-sans, system-ui)',color:'var(--color-ink)',colorScheme:options.theme};
 for(const [key,value] of Object.entries(options.shape||{}))style['--concept-'+key]=value;
 for(const [key,value] of Object.entries(options.density||{}))if(typeof value==='string')style['--ui-'+key]=value;
 return style as React.CSSProperties;
}
export function ScopedPreview({options,Adapter}:{options:PreviewOptions;Adapter:React.ComponentType}){
 const id='ps-library-'+useId().replace(/[^a-z0-9-]/gi,'');
 const [portal,setPortal]=useState<HTMLDivElement|null>(null);
 useLayoutEffect(()=>{const node=document.createElement('div');node.id=id;node.className='ps-library ps-library-portal';document.body.append(node);setPortal(node);return()=>node.remove();},[id]);
 useLayoutEffect(()=>{
  if(!portal)return;
  portal.dataset.libraryPortal=options.library;portal.dataset.theme=options.theme;portal.dataset.concept=options.concept;portal.dataset.style=options.style||'';
  portal.setAttribute('data-mantine-color-scheme',options.theme);
  portal.removeAttribute('style');Object.assign(portal.style,scopeStyle(options));
  for(const [key,value]of Object.entries(scopeStyle(options)))if(key.startsWith('--'))portal.style.setProperty(key,String(value));
 },[portal,options]);
 return <div className="ps-library" data-library-runtime={options.library} data-theme={options.theme} data-concept={options.concept} data-style={options.style} style={scopeStyle(options)}>
  {portal&&<Context.Provider value={{options,portal,id}}><Adapter/></Context.Provider>}
 </div>;
}
