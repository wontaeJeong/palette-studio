import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {Button,TooltipTrigger,Tooltip,DialogTrigger,ModalOverlay,Modal,Dialog,Heading,Text,Popover} from 'react-aria-components';
import {Toaster,toast} from 'sonner';
import {useScope,mark,trigger,copy} from './shared';
export function Adapter(){
 const {portal,id,options}=useScope();const owned=useRef<Array<string|number>>([]);
 const notify=()=>{const value=toast.success(<span {...mark('toast')}>{copy.toast}</span>,{toasterId:id,description:copy.detail,action:<button className="ps-control" data-library-dismiss="toast" onClick={()=>toast.dismiss(value)}>닫기</button>});owned.current.push(value);};
 useEffect(()=>()=>{owned.current.forEach(value=>toast.dismiss(value));},[]);
 return <><div className="ps-actions">
  <Button className="ps-control ps-primary" {...trigger('button')} onPress={notify}>프로젝트 저장</Button>
  <TooltipTrigger delay={0}><Button className="ps-control" {...trigger('tooltip')}>도움말</Button><Tooltip UNSTABLE_portalContainer={portal} offset={8} className="ps-tooltip" {...mark('tooltip')}>{copy.tooltip}</Tooltip></TooltipTrigger>
  <DialogTrigger><Button className="ps-control" {...trigger('dialog')}>대화상자</Button><ModalOverlay UNSTABLE_portalContainer={portal} className="ps-modal-overlay" isDismissable><Modal className="ps-rac-modal"><Dialog className="ps-surface" {...mark('dialog')} data-concept-part="surface"><Heading slot="title" data-concept-part="title">{copy.title}</Heading><Text slot="description">{copy.description}</Text><div className="ps-actions"><Button slot="close" className="ps-control">닫기</Button></div></Dialog></Modal></ModalOverlay></DialogTrigger>
  <DialogTrigger><Button className="ps-control" {...trigger('popover')}>추가 정보</Button><Popover UNSTABLE_portalContainer={portal} offset={8} containerPadding={12} className="ps-popover ps-surface" {...mark('popover')} data-concept-part="surface"><Dialog><Heading slot="title">{copy.popover}</Heading><p>{copy.description}</p><Button slot="close" className="ps-control">닫기</Button></Dialog></Popover></DialogTrigger>
  <Button className="ps-control" {...trigger('toast')} onPress={notify}>알림 보기</Button>
 </div>{createPortal(<Toaster id={id} theme={options.theme} visibleToasts={3} closeButton position="top-right" toastOptions={{classNames:{toast:'ps-toast',title:'ps-toast-title'},duration:6000}}/>,portal)}
 </>;
}
