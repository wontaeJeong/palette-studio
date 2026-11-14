import React from 'react';
import {Button} from '@base-ui/react/button';
import {Tooltip} from '@base-ui/react/tooltip';
import {Dialog} from '@base-ui/react/dialog';
import {Popover} from '@base-ui/react/popover';
import {Toast} from '@base-ui/react/toast';
import {useScope,mark,trigger,copy} from './shared';
function Content(){
 const {portal}=useScope(),manager=Toast.useToastManager();
 return <>
  <div className="ps-actions">
   <Button className="ps-control ps-primary" {...trigger('button')} onClick={()=>manager.add({title:copy.toast,description:copy.detail})}>프로젝트 저장</Button>
   <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger className="ps-control" {...trigger('tooltip')} delay={0}>도움말</Tooltip.Trigger><Tooltip.Portal container={portal}><Tooltip.Positioner sideOffset={8} className="ps-positioner"><Tooltip.Popup className="ps-tooltip" {...mark('tooltip')}>{copy.tooltip}</Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>
   <Dialog.Root><Dialog.Trigger className="ps-control" {...trigger('dialog')}>대화상자</Dialog.Trigger><Dialog.Portal container={portal}><Dialog.Backdrop className="ps-backdrop"/><Dialog.Popup className="ps-dialog ps-surface" {...mark('dialog')} data-concept-part="surface"><Dialog.Title data-concept-part="title">{copy.title}</Dialog.Title><Dialog.Description>{copy.description}</Dialog.Description><Dialog.Close className="ps-control">닫기</Dialog.Close></Dialog.Popup></Dialog.Portal></Dialog.Root>
   <Popover.Root><Popover.Trigger className="ps-control" {...trigger('popover')}>추가 정보</Popover.Trigger><Popover.Portal container={portal}><Popover.Positioner sideOffset={8} className="ps-positioner"><Popover.Popup className="ps-popover ps-surface" {...mark('popover')} data-concept-part="surface"><Popover.Title>{copy.popover}</Popover.Title><Popover.Description>{copy.description}</Popover.Description><Popover.Close className="ps-control">닫기</Popover.Close></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>
   <Button className="ps-control" {...trigger('toast')} onClick={()=>manager.add({title:copy.toast,description:copy.detail})}>알림 보기</Button>
  </div>
  <Toast.Portal container={portal}><Toast.Viewport className="ps-toasts">{manager.toasts.map(toast=><Toast.Root key={toast.id} toast={toast} className="ps-toast ps-surface" {...mark('toast')}><Toast.Content><Toast.Title className="ps-toast-title"/><Toast.Description/><div className="ps-actions"><Toast.Action className="ps-control" onClick={()=>manager.close(toast.id)}>확인</Toast.Action><Toast.Close className="ps-control" data-library-dismiss="toast">닫기</Toast.Close></div></Toast.Content></Toast.Root>)}</Toast.Viewport></Toast.Portal>
 </>;
}
export function Adapter(){return <Toast.Provider limit={3} timeout={6000}><Content/></Toast.Provider>;}
