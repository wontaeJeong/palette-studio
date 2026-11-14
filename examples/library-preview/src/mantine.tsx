import React,{useState} from 'react';
import {MantineProvider,Button,Tooltip,Modal,Popover,Text,createTheme} from '@mantine/core';
import {Notifications,createNotificationsStore,notifications} from '@mantine/notifications';
import {useScope,mark,trigger,copy} from './shared';
export function Adapter(){
 const {options,portal}=useScope(),[opened,setOpened]=useState(false),[popover,setPopover]=useState(false),[store]=useState(createNotificationsStore);
 const t=options.tokens;
 const theme=createTheme({fontFamily:options.fonts?.bodyFamily||'var(--kit-font-sans,system-ui)',fontFamilyMonospace:options.fonts?.codeFamily||'var(--kit-font-mono,monospace)',primaryColor:'selected',colors:{selected:[t['--color-surface-soft'],t['--color-surface-soft'],t['--color-line'],t['--color-line-strong'],t['--color-accent'],t['--color-accent'],t['--color-accent'],t['--color-accent-strong'],t['--color-accent-strong'],t['--color-accent-strong']]},defaultRadius:'selected',radius:{selected:String(options.shape?.radius||'6px')}});
 const notify=()=>notifications.show({title:copy.toast,message:copy.detail,autoClose:6000,classNames:{root:'ps-toast'},...mark('toast'),closeButtonProps:{'aria-label':'닫기','data-library-dismiss':'toast'}},store);
 return <MantineProvider theme={theme} forceColorScheme={options.theme} getRootElement={()=>portal} cssVariablesSelector={'#'+portal.id} withGlobalClasses={false} cssVariablesResolver={()=>({variables:{},light:{'--mantine-color-body':t['--color-raised'],'--mantine-color-text':t['--color-ink'],'--mantine-color-dimmed':t['--color-ink-muted']},dark:{'--mantine-color-body':t['--color-raised'],'--mantine-color-text':t['--color-ink'],'--mantine-color-dimmed':t['--color-ink-muted']}})}>
 <div className="ps-actions">
  <Button className="ps-control ps-primary" {...trigger('button')} onClick={notify}>프로젝트 저장</Button>
  <Tooltip events={{hover:true,focus:true,touch:false}} label={copy.tooltip} portalProps={{target:portal}} openDelay={0} classNames={{tooltip:"ps-tooltip"}} {...mark('tooltip')}><Button variant="outline" className="ps-control" {...trigger('tooltip')}>도움말</Button></Tooltip>
  <Button variant="outline" className="ps-control" {...trigger('dialog')} onClick={()=>setOpened(true)}>대화상자</Button>
  <Modal opened={opened} onClose={()=>setOpened(false)} title={copy.title} portalProps={{target:portal}} zIndex={1300} transitionProps={{duration:0}} classNames={{content:'ps-surface',title:'ps-concept-title'}} closeButtonProps={{'aria-label':'닫기'}}><div {...mark('dialog')}><Text>{copy.description}</Text><Button className="ps-control" onClick={()=>setOpened(false)}>닫기</Button></div></Modal>
  <Popover opened={popover} onChange={setPopover} portalProps={{target:portal}} position="bottom-start" withArrow={false} zIndex={1400}><Popover.Target><Button variant="outline" className="ps-control" {...trigger('popover')} onClick={()=>setPopover(v=>!v)}>추가 정보</Button></Popover.Target><Popover.Dropdown className="ps-popover ps-surface" {...mark('popover')} data-concept-part="surface"><h3>{copy.popover}</h3><Text>{copy.description}</Text><Button className="ps-control" onClick={()=>setPopover(false)}>닫기</Button></Popover.Dropdown></Popover>
  <Button variant="outline" className="ps-control" {...trigger('toast')} onClick={notify}>알림 보기</Button>
 </div><Notifications store={store} portalProps={{target:portal}} limit={3} zIndex={1600} position="top-right" transitionDuration={0} containerWidth="min(360px, calc(100vw - 24px))"/>
 </MantineProvider>;
}
