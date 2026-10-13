'use strict';
const fs=require('fs');
const postcss=require('postcss');
const {styles}=require('./design-token-migration.cjs');
const tokens=['dads','brand','semantic'].map(name=>fs.readFileSync('static/design-system/tokens/'+name+'.css','utf8')).join('\n')+fs.readFileSync('static/design-system/product-geometry.css','utf8')+fs.readFileSync('static/design-system/template-geometry.css','utf8');
const defined=new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(match=>match[1]));
const files=process.argv.length>2?process.argv.slice(2):styles;
const errors=[];
for(const file of files) {
  const root=postcss.parse(fs.readFileSync(file,'utf8'));
  // Component-local configuration variables are valid when declared in the file.
  root.walkDecls(decl=>{if(decl.prop.startsWith('--'))defined.add(decl.prop);});
  root.walkDecls(decl=>{
    if(decl.parent.type==='atrule'&&decl.parent.name==='font-face') return;
    const value=decl.value.replace(/url\([^)]*\)/g,'');
    for(const match of value.matchAll(/var\((--[\w-]+)/g)) if(!defined.has(match[1])) errors.push({file,property:decl.prop,reason:'Undefined token: '+match[1]});
    if(/#[a-f\d]{3,8}\b|rgba?\(|\b(?:black|white|grey|gray|red|yellow|green|blue|orange|lightgreen|lightgray)\b/i.test(value)) errors.push({file,property:decl.prop,value,reason:'Literal color'});
    if(decl.prop==='font-size'&&!/var\(--app-/.test(value)) errors.push({file,property:decl.prop,value,reason:'Literal font size'});
    if(/var\(--dads-/.test(value)) errors.push({file,property:decl.prop,reason:'Layer 3 references Layer 1'});
    if(decl.prop==='outline'&&/^(?:none|0)$/.test(value)) errors.push({file,property:decl.prop,reason:'Focus removed'});
  });
}
if(errors.length) {console.error(JSON.stringify(errors,null,2));process.exitCode=1;}
else console.log('PASS: '+files.length+' stylesheets; tokens resolve, no literal color/font size, focus retained.');
