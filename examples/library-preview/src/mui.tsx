import React,{useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {Button,Tooltip,Dialog,DialogTitle,DialogContent,DialogContentText,DialogActions,Popover,Snackbar,Alert,ThemeProvider,createTheme} from '@mui/material';
import {useScope,mark,trigger,copy} from './shared';
export function Adapter(){
 const {options,portal}=useScope(),[opened,setOpened]=useState(false),[anchor,setAnchor]=useState<HTMLButtonElement|null>(null),[notice,setNotice]=useState(false);
 const theme=useMemo(()=>{const t=options.tokens;return createTheme({palette:{mode:options.theme,primary:{main:t['--color-accent'],contrastText:t['--color-on-accent']},background:{default:t['--color-canvas'],paper:t['--color-raised']},text:{primary:t['--color-ink'],secondary:t['--color-ink-muted']},divider:t['--color-line-strong'],success:{main:t['--color-success']},warning:{main:t['--color-warning']},error:{main:t['--color-danger']},info:{main:t['--color-info']}},typography:{fontFamily:options.fonts?.bodyFamily||'var(--kit-font-sans,system-ui)'},shape:{borderRadius:parseInt(String(options.shape?.radius||6))},components:{MuiButton:{styleOverrides:{root:{textTransform:'none'}}}}});},[options]);
 return <ThemeProvider theme={theme}><div className="ps-actions">
  <Button variant="contained" className="ps-control ps-primary" {...trigger('button')} onClick={()=>setNotice(true)}>프로젝트 저장</Button>
  <Tooltip title={copy.tooltip} enterDelay={0} slotProps={{popper:{container:portal},tooltip:{className:'ps-tooltip',...mark('tooltip')}}}><Button variant="outlined" className="ps-control" {...trigger('tooltip')}>도움말</Button></Tooltip>
  <Button variant="outlined" className="ps-control" {...trigger('dialog')} onClick={()=>setOpened(true)}>대화상자</Button>
  <Dialog open={opened} onClose={()=>setOpened(false)} container={portal} aria-labelledby={portal.id+'-title'} slotProps={{paper:{className:'ps-surface',...mark('dialog'),...{'data-concept-part':'surface'}}}}><DialogTitle id={portal.id+'-title'} data-concept-part="title">{copy.title}</DialogTitle><DialogContent><DialogContentText>{copy.description}</DialogContentText></DialogContent><DialogActions><Button className="ps-control" onClick={()=>setOpened(false)}>닫기</Button></DialogActions></Dialog>
  <Button variant="outlined" className="ps-control" {...trigger('popover')} onClick={e=>setAnchor(e.currentTarget)}>추가 정보</Button>
  <Popover open={!!anchor} anchorEl={anchor} onClose={()=>setAnchor(null)} container={portal} anchorOrigin={{vertical:'bottom',horizontal:'left'}} marginThreshold={12} slotProps={{paper:{className:'ps-popover ps-surface',...mark('popover'),...{'data-concept-part':'surface'}}}}><h3>{copy.popover}</h3><p>{copy.description}</p><Button className="ps-control" onClick={()=>setAnchor(null)}>닫기</Button></Popover>
  <Button variant="outlined" className="ps-control" {...trigger('toast')} onClick={()=>setNotice(true)}>알림 보기</Button>
 </div>{createPortal(<Snackbar open={notice} autoHideDuration={6000} onClose={(_,reason)=>{if(reason!=='clickaway')setNotice(false);}} anchorOrigin={{vertical:'top',horizontal:'right'}}><Alert severity="success" variant="outlined" className="ps-toast" {...mark('toast')} action={<Button className="ps-control" data-library-dismiss="toast" onClick={()=>setNotice(false)}>닫기</Button>}><strong>{copy.toast}</strong><div>{copy.detail}</div></Alert></Snackbar>,portal)}</ThemeProvider>;
}
