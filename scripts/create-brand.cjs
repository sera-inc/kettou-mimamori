'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const blue='#0017c1';
const mark='<path fill="'+blue+'" d="M32 3C25 14 10 26 10 39a22 22 0 0 0 44 0C54 26 39 14 32 3Z"/><path fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="M18 39h8l4-8 5 17 4-9h7"/>';
const svg=(content,box='0 0 24 24',color=blue)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+box+'" fill="none" stroke="'+color+'" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+content+'</svg>';
const paths={
  'help-circled':'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
  'angle-double-up':'<path d="m5 12 7-7 7 7m-14 7 7-7 7 7"/>',
  'angle-double-down':'<path d="m5 5 7 7 7-7m-14 7 7 7 7-7"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  cog:'<path d="m9 3-.5 3-2.5 1-2.5-1.5-2 3.5L4 11v2l-2.5 2 2 3.5L6 17l2.5 1L9 21h6l.5-3 2.5-1 2.5 1.5 2-3.5-2.5-2v-2l2.5-2-2-3.5L18 7l-2.5-1L15 3Z"/><circle cx="12" cy="12" r="3"/>',
  'cancel-circled':'<circle cx="12" cy="12" r="9"/><path d="m8 8 8 8m0-8-8 8"/>',
  volume:'<path d="M3 9h4l5-4v14l-5-4H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  hourglass:'<path d="M6 3h12M6 21h12M7 3v4l10 10v4M17 3v4L7 17v4M9 6h6M9 18h6"/>',
  calc:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h2m4 0h2"/>',
  tint:'<path d="M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13Z"/>',
  'chart-line':'<path d="M3 3v18h18M6 15l4-6 5 3 6-7"/>',
  'sort-numeric':'<path d="M5 4v16m-3-3 3 3 3-3M14 4h4v5h-4M14 13h4v3h-4v4h4"/>',
  edit:'<path d="m4 15-1 6 6-1L21 8l-5-5Zm10-10 5 5M4 15l5 5"/>',
  lock:'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3m-5 4v4"/>',
  'lock-open':'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0m-5 7v4"/>',
  'trash-empty':'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  up:'<path d="M12 21V3m-8 8 8-8 8 8"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  check:'<path d="m4 12 5 5L20 6"/>'
};
for(const percent of [25,50,75,100])paths['battery-'+percent]='<rect x="2" y="6" width="18" height="12" rx="2"/><path d="M22 10v4"/><rect x="5" y="9" width="'+(12*percent/100)+'" height="6" fill="'+blue+'" stroke="none"/>';
(async()=>{
  fs.mkdirSync('static/brand/icons',{recursive:true});fs.writeFileSync('static/brand/mark.svg',svg('<title>血糖みまもり</title>'+mark,'0 0 64 64'));
  const logo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64"><title>血糖みまもり</title>'+mark+'<text x="74" y="44" fill="'+blue+'" font-size="32" font-weight="700" font-family="Noto Sans JP, sans-serif">血糖みまもり</text></svg>';fs.writeFileSync('static/brand/logo.svg',logo);
  for(const [name,content]of Object.entries(paths))fs.writeFileSync('static/brand/icons/'+name+'.svg',svg(content));
  let css='/* Original line icons. Keep existing classes, names and handlers. */\nhtml body [class^="icon-"]::before,html body [class*=" icon-"]::before {content:"";display:inline-block;width:1em;height:1em;vertical-align:-0.125em;margin-inline:0.2em;background-color:currentColor;mask:var(--app-icon) center/contain no-repeat;-webkit-mask:var(--app-icon) center/contain no-repeat;font-family:inherit;}\n';
  for(const name of Object.keys(paths))css+='html body .icon-'+name+' {--app-icon:url("/brand/icons/'+name+'.svg");}\n';
  css+='@media (forced-colors:active) {html body [class^="icon-"]::before,html body [class*=" icon-"]::before {forced-color-adjust:none;background-color:CanvasText;}}\n';fs.writeFileSync('static/design-system/icons.css',css);
  const glyphClasses=[...fs.readFileSync('static/glyphs/css/fontello-codes.css','utf8').matchAll(/\.icon-([\w-]+):before/g)].map(m=>m[1]);assert(glyphClasses.every(name=>Object.hasOwn(paths,name)));
  const directions={NONE:'<circle cx="32" cy="32" r="4" fill="'+blue+'"/>',Flat:'<path d="M12 32h40m-12-12 12 12-12 12"/>',SingleUp:'<path d="M32 52V12m-12 12 12-12 12 12"/>',SingleDown:'<path d="M32 12v40m-12-12 12 12 12-12"/>',FortyFiveUp:'<path d="m14 50 36-36M30 14h20v20"/>',FortyFiveDown:'<path d="m14 14 36 36M30 50h20V30"/>'};
  for(const direction of ['DoubleUp','TripleUp','DoubleDown','TripleDown']){const up=direction.endsWith('Up'),n=direction.startsWith('Double')?2:3;directions[direction]=Array.from({length:n},(_,i)=>{const x=n===2?22+i*20:14+i*18;return '<path d="M'+x+' '+(up?52:12)+'V'+(up?12:52)+'m-7 '+(up?7:-7)+' 7 '+(up?-7:7)+' 7 '+(up?7:-7)+'"/>';}).join('');}
  for(const [name,content]of Object.entries(directions))fs.writeFileSync('static/images/'+name+'.svg',svg(content,'0 0 64 64'));
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage({deviceScaleFactor:1});
    async function png(file,width,height,background=true){await page.setViewportSize({width,height});const size=Math.min(width,height);await page.setContent('<!doctype html><html><body style="margin:0;background:'+(background?'white':'transparent')+';width:100vw;height:100vh;display:grid;place-items:center">'+svg(mark,'0 0 64 64').replace('<svg ','<svg style="width:'+Math.floor(size*.8)+'px;height:'+Math.floor(size*.8)+'px" ')+'</body></html>');await page.screenshot({path:file,omitBackground:!background});}
    for(const file of fs.readdirSync('static/images').filter(n=>/^(android-chrome-|apple-touch-icon|favicon-|mstile-).*\.png$/.test(n))){const match=file.match(/(\d+)x(\d+)/);await png('static/images/'+file,match?Number(match[1]):180,match?Number(match[2]):180);}
    await png('static/images/round1.png',64,64);await png('static/images/launch.png',320,460);
    for(const [file,width,height]of [['logo1.png',320,64],['logo2.png',320,64],['logomobile.png',192,192],['large.png',512,512]])await png('static/images/'+file,width,height);
    await png('static/brand/icon-192.png',192,192);await png('static/brand/icon-512.png',512,512);
    const pngData=fs.readFileSync('static/images/favicon-32x32.png'),header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=32;header[7]=32;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(pngData.length,14);header.writeUInt32LE(22,18);fs.writeFileSync('static/images/favicon.ico',Buffer.concat([header,pngData]));
  }finally{await browser.close();}
  const generated='C:/Users/kny12/.codex/generated_images/01a12fad-16fe-7d62-a0db-d2f1444b22f3/exec-289e39b2-c98f-4ab2-ae0a-c6a030794172.png';fs.copyFileSync(generated,'static/brand/care-connection.png');
  fs.writeFileSync('docs/brand-assets.json',JSON.stringify({service:'血糖みまもり',repository:'kettou-mimamori',mark:'Original droplet and trend stroke, drawn in native SVG; public service design clarity and DADS blue',icons:Object.keys(paths),directionNames:Object.keys(directions),rasterIllustration:{tool:'Codex built-in image generation (user-approved alternative to an unavailable selectable Image2.5)',source:path.basename(generated),file:'static/brand/care-connection.png',description:'Original blue-and-white illustration of a person checking a phone and a healthcare worker checking a tablet, connected by a trend line; no government logo or official endorsement'},pngIcons:'Deterministic browser rasterization of the original SVG mark; no generated illustration editing'},null,2));console.log('PASS: original mark, '+Object.keys(paths).length+' icons, '+Object.keys(directions).length+' direction assets, PWA/tile/favicon PNGs and generated illustration saved in repository.');
})().catch(e=>{console.error(e);process.exitCode=1;});
