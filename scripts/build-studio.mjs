import { build } from "esbuild";
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
// Runtime export discovery must use the same production condition as esbuild.
process.env.NODE_ENV = "production";
const require = createRequire(import.meta.url);
const web = path.join(root, "out/web");
const dependencyNames = new Set(Object.keys(JSON.parse(await readFile(path.join(root,"package.json"),"utf8")).dependencies));
// Resolve package specifiers from the root while retaining esbuild's package
// export conditions. Directory aliases would select CJS and defeat tree shaking.
const rootDependencies = {
  name:"root-dependencies",
  setup(builder) {
    builder.onResolve({filter:/^[^./]/}, args=> {
      const name = args.path.startsWith("@") ? args.path.split("/").slice(0,2).join("/") : args.path.split("/")[0];
      if (!dependencyNames.has(name) || args.pluginData?.rootDependency) return;
      return builder.resolve(args.path,{resolveDir:root,kind:args.kind,pluginData:{rootDependency:true}});
    });
  },
};
const options = {
  absWorkingDir: root,
  bundle: true,
  target: "es2020",
  // Type-only root paths pin declarations; keep runtime package exports intact.
  tsconfigRaw: {compilerOptions:{target:"ES2020",jsx:"react-jsx"}},
  // Preserve third-party CSS text while emitting whitespace-clean JS strings.
  supported: { "template-literal": false },
  minify: true,
  legalComments: "none",
  metafile: true,
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {react:path.join(root,"node_modules/react"),"react-dom":path.join(root,"node_modules/react-dom")},
};
const classic = await build({...options, entryPoints:["src/studio/main.tsx"], outfile:"assets/studio.js", format:"iife",plugins:[rootDependencies]});
const shell = await readFile(path.join(root,"src/studio/shell.html"),"utf8");
await writeFile(path.join(root,"index.html"),shell);
await rm(web,{recursive:true,force:true});
await mkdir(path.join(web,"assets"),{recursive:true});
// One shared React/DOM/scope module graph. Adapter entries contain their complete
// library dependencies; only modules already required by the shell are external.
// This makes retrying a failed adapter URL sufficient (no poisoned child imports).
const runtimeNames = new Map([
  ["react","runtime-react"], ["react-dom","runtime-dom"],
  ["react-dom/client","runtime-client"], ["react/jsx-runtime","runtime-jsx"],
  ["react/jsx-dev-runtime","runtime-jsx-dev"], ["react/compiler-runtime","runtime-compiler"],
]);
const shared = path.join(root,"examples/library-preview/src/shared");
const virtualRuntime = {
  name:"runtime-entries",
  setup(builder) {
    builder.onResolve({filter:/^studio-runtime:/}, args=>({path:args.path.slice(15),namespace:"studio-runtime"}));
    builder.onLoad({filter:/.*/,namespace:"studio-runtime"}, args=>({
      contents:`import implementation from ${JSON.stringify(args.path)}; export default implementation; export const {${Object.keys(require(args.path)).filter(key=>key!=="default").join(",")}} = implementation;`,
      resolveDir:root,
    }));
  },
};
const runtimes = await build({...options, format:"esm", splitting:true, outdir:path.join(web,"assets"),chunkNames:"shared-[hash]",entryPoints:{...Object.fromEntries([...runtimeNames].map(([spec,name])=>[name,"studio-runtime:"+spec])),"preview-shared":shared+".tsx"},plugins:[virtualRuntime,rootDependencies]});
const externalRuntime = {
  name:"shared-runtime",
  setup(builder) {
    builder.onResolve({filter:/^react(?:-dom)?(?:\/.*)?$/}, args=> {
      const name = runtimeNames.get(args.path);
      if (!name) throw Error("Unmapped React runtime import: "+args.path);
      return {path:name,namespace:"shared-runtime"};
    });
    builder.onResolve({filter:/shared(?:\.tsx)?$/}, args=> {
      if (path.resolve(args.resolveDir,args.path).replace(/\.tsx$/,"") === shared) return {path:"preview-shared",namespace:"shared-runtime"};
    });
    builder.onLoad({filter:/.*/,namespace:"shared-runtime"}, args=>({contents:`export ${args.path === "preview-shared" ? "*" : "{default}"} from "./${args.path}.js"; export * from "./${args.path}.js";`,resolveDir:root}));
    builder.onResolve({filter:/^\.\/(runtime-|preview-shared)/,namespace:"shared-runtime"}, args=>({path:args.path,external:true}));
    builder.onResolve({filter:/library-loader$/}, args=>({path:path.join(root,"src/studio/library-loader.web.ts")}));
  },
};
const entries = {studio:"src/studio/main.tsx",...Object.fromEntries(["base-ui","radix","react-aria","mui","mantine"].map(id=>["library-"+id,"examples/library-preview/src/"+id+".tsx"]))};
const modules = await build({...options,alias:{},format:"esm",outdir:path.join(web,"assets"),entryPoints:entries,plugins:[externalRuntime,rootDependencies]});
// Keep the independent legacy preview's existing complete notices, unioned with
// every package actually shipped by either new build (including transitive deps).
const separator = "\n\n"+"=".repeat(72)+"\n";
const previous = await readFile(path.join(root,"assets/library-preview-LICENSES.txt"),"utf8");
const sections = new Map(previous.split(separator).slice(1).map(section=>[section.split("\n")[0],section.trimEnd()]));
const shipped = new Set([classic,runtimes,modules].flatMap(result=>Object.values(result.metafile.outputs).flatMap(output=>Object.entries(output.inputs).filter(([,info])=>info.bytesInOutput>0).map(([file])=>file))));
if ([...shipped].some(file=>file.includes("examples/library-preview/node_modules/"))) throw Error("Root studio build resolved independent preview dependencies");
const packages = new Map();
for (const file of shipped) {
  if (!file.includes("node_modules/")) continue;
  let directory = path.dirname(path.resolve(root,file));
  while (directory.startsWith(root)) {
    const manifest=path.join(directory,"package.json");
    if (existsSync(manifest)) {
      const data=JSON.parse(await readFile(manifest,"utf8"));
      if(data.name && data.version){packages.set(data.name+"@"+data.version,{directory,data});break;}
    }
    directory=path.dirname(directory);
  }
}
for (const [key,{directory,data}] of packages) {
  const heading=key+" ("+data.license+")";
  const files=(await readdir(directory)).filter(file=>/^(licen[sc]e|notice|copying)(\.|$|-)/i.test(file) && existsSync(path.join(directory,file)));
  let section=heading+"\n";
  if (!files.length) {
    const fallback=path.join(root,"examples/library-preview/licenses/"+data.name.replaceAll("/","-")+"-"+data.version+"-LICENSE.txt");
    if(!existsSync(fallback)) throw Error("Missing full license for shipped package "+key);
    section+="\nPreserved upstream license (see examples/library-preview/licenses/README.md)\n"+await readFile(fallback,"utf8");
  }
  for (const file of files) if((await stat(path.join(directory,file))).isFile()) section+="\n"+file+"\n"+await readFile(path.join(directory,file),"utf8")+"\n";
  sections.set(heading,section.split("\n").map(line=>line.trimEnd()).join("\n").trimEnd());
}
const notices="Palette Studio library previews and React studio — third-party notices\nGenerated from pinned package locks; retain when redistributing the artifacts.\n"+[...sections].sort(([a],[b])=>a.localeCompare(b)).map(([,section])=>separator+section).join("")+"\n";
await writeFile(path.join(root,"assets/library-preview-LICENSES.txt"),notices);
execFileSync("python3",[path.join(root,"scripts/bundle.py")],{cwd:root,stdio:"inherit"});
// Copy the local reference/document graph, fonts and legacy pages. Never ship
// installed dependencies or development metadata in the independent web folder.
const copyOptions={recursive:true,filter:source=>!source.split(path.sep).some(part=>["node_modules","dist",".git",".DS_Store"].includes(part))};
for(const directory of ["assets","css","data","docs","agents","examples","packages","previews","reference"]) {
  // Preserve the ESM files while copying the classic assets beside them.
  if(directory==="assets") {
    for(const file of await readdir(path.join(root,directory))) if(file!=="studio.js") await cp(path.join(root,directory,file),path.join(web,directory,file),copyOptions);
  } else await cp(path.join(root,directory),path.join(web,directory),copyOptions);
}
for(const file of await readdir(root)) if(/\.(html|js|md)$/.test(file)||["LICENSE","package.json","package-lock.json","tsconfig.json"].includes(file)) await cp(path.join(root,file),path.join(web,file));
await writeFile(path.join(web,"index.html"),shell.replace('<script src="assets/studio.js"></script>','<script type="module" src="assets/studio.js"></script>'));
console.log("Built classic React studio and split ESM out/web; retained "+sections.size+" full package notices");
