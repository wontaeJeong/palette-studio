import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {ScopedPreview,type PreviewOptions} from './shared';
import {Adapter as Base} from './base-ui';
import {Adapter as Radix} from './radix';
import {Adapter as Aria} from './react-aria';
import {Adapter as Mui} from './mui';
import {Adapter as Mantine} from './mantine';
const adapters:Record<string,React.ComponentType>={'base-ui':Base,radix:Radix,'react-aria':Aria,mui:Mui,mantine:Mantine};
export function mount(element:HTMLElement,options:PreviewOptions){
 const root=createRoot(element);let alive=true;
 const update=(next:PreviewOptions)=>{if(!alive)return;const Adapter=adapters[next.library];if(!Adapter)throw Error('Unknown preview library '+next.library);flushSync(()=>root.render(<ScopedPreview key={next.library} options={next} Adapter={Adapter}/>));};
 update(options);return {update,unmount(){if(alive){alive=false;flushSync(()=>root.unmount());}}};
}
