/* Fast CI guard: fail when preview images or any captured UI source drift. */
"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const {sourceHash,screenshots}=require("./capture-previews.cjs");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"previews/screenshots.json"),"utf8"));
assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.network,"offline");
assert.equal(manifest.sourceHash,sourceHash(),"UI sources changed since last screenshots. Run the capture workflow.");
assert.deepEqual(manifest.screenshots.map(x=>x.path).sort(),screenshots.slice().sort());
for(const img of manifest.screenshots){
  const data=fs.readFileSync(path.join(root,"previews",img.path));
  assert(data.length>8000, img.path+" is empty");
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a","Invalid PNG "+img.path);
  assert.equal(data.readUInt32BE(16),img.width,img.path+" width mismatch");
  assert.equal(data.readUInt32BE(20),img.height,img.path+" height mismatch");
  assert.equal(data.length,img.bytes,img.path+" byte count mismatch");
  assert.equal(crypto.createHash("sha256").update(data).digest("hex"),
    img.sha256,"Screenshot changed without manifest update: "+img.path);
}
console.log("Verified "+manifest.screenshots.length+" current screenshots, sizes, hashes and UI source fingerprint.");
