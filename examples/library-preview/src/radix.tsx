import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import {Toaster,toast} from 'sonner';
import {useScope,mark,trigger,copy} from './shared';
export function Adapter(){
 const {portal,id,options}=useScope();const owned=useRef<Array<string|number>>([]);
 const notify=()=>{const value=toast.success(<span {...mark('toast')}>{copy.toast}</span>,{toasterId:id,description:copy.detail,action:<button className="ps-control" data-library-dismiss="toast" onClick={()=>toast.dismiss(value)}>닫기</button>});owned.current.push(value);};
 useEffect(()=>()=>{owned.current.forEach(value=>toast.dismiss(value));},[]);
 return <><div className="ps-actions">
  <button className="ps-control ps-primary" {...trigger('button')} onClick={notify}>프로젝트 저장</button>
  <Tooltip.Provider delayDuration={0}><Tooltip.Root><Tooltip.Trigger asChild><button className="ps-control" {...trigger('tooltip')}>도움말</button></Tooltip.Trigger><Tooltip.Portal container={portal}><Tooltip.Content sideOffset={8} className="ps-tooltip" {...mark('tooltip')}>{copy.tooltip}</Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>
  <Dialog.Root><Dialog.Trigger asChild><button className="ps-control" {...trigger('dialog')}>대화상자</button></Dialog.Trigger><Dialog.Portal container={portal}><Dialog.Overlay className="ps-backdrop"/><Dialog.Content className="ps-dialog ps-surface" {...mark('dialog')} data-concept-part="surface"><Dialog.Title data-concept-part="title">{copy.title}</Dialog.Title><Dialog.Description>{copy.description}</Dialog.Description><Dialog.Close asChild><button className="ps-control">닫기</button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  <Popover.Root><Popover.Trigger asChild><button className="ps-control" {...trigger('popover')}>추가 정보</button></Popover.Trigger><Popover.Portal container={portal}><Popover.Content sideOffset={8} collisionPadding={12} className="ps-popover ps-surface" {...mark('popover')} data-concept-part="surface"><h3>{copy.popover}</h3><p>{copy.description}</p><Popover.Close className="ps-control">닫기</Popover.Close></Popover.Content></Popover.Portal></Popover.Root>
  <button className="ps-control" {...trigger('toast')} onClick={notify}>알림 보기</button>
 </div>{createPortal(<Toaster id={id} theme={options.theme} visibleToasts={3} closeButton position="top-right" toastOptions={{classNames:{toast:'ps-toast',title:'ps-toast-title'},duration:6000}}/>,portal)}
 </>;
}
