'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const plan='docs/service-metadata-plan.json',digest=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
function reverse(file,current){
  const record=JSON.parse(fs.readFileSync(plan)).find(r=>r.file===file);if(!record)return current;const result=JSON.parse(JSON.stringify(current));
  for(const row of record.rows.slice().reverse()){let parent=result;for(const key of row.path.slice(0,-1))parent=parent[key];const key=row.path.at(-1);assert.deepEqual(parent[key],row.after);if(row.existed)parent[key]=row.before;else delete parent[key];}
  assert.equal(digest(result),record.beforeSemanticSHA256,file+': dependency/configuration semantics preserved');return result;
}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='verify'){for(const r of JSON.parse(fs.readFileSync(plan)))reverse(r.file,JSON.parse(fs.readFileSync(r.file)));console.log('PASS: service/package/repository metadata and deployment Japanese text reverse exactly; locked dependencies and configuration identifiers unchanged.');}
  else if(process.argv[2]==='apply'){
    assert(!fs.existsSync(plan));const records=[];
    function change(file,specs){const obj=JSON.parse(fs.readFileSync(file)),record={file,beforeSemanticSHA256:digest(obj),rows:[]};for(const [keys,after]of specs){let parent=obj;for(const key of keys.slice(0,-1))parent=parent[key];const key=keys.at(-1);record.rows.push({path:keys,existed:Object.hasOwn(parent,key),before:parent[key],after});parent[key]=after;}records.push(record);fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');}
    change('package.json',[[['name'],'kettou-mimamori'],[['description'],'血糖値の推移、治療記録、食品とプロフィールを確認する血糖みまもり'],[['repository','url'],'https://github.com/sera-inc/kettou-mimamori.git'],[['protocolName'],'nightscout']]);
    change('package-lock.json',[[['name'],'kettou-mimamori'],[['packages','','name'],'kettou-mimamori']]);
    const descriptions={
      MONGODB_URI:'MongoDBの接続文字列を指定します。接続先と認証情報は、利用するデータベースの管理者へ確認してください。',
      ALARM_HIGH:'新しいブラウザの高血糖警報の初期設定です。血糖値がBG_TARGET_TOPを超えると発動します。onまたはoffを指定します。',
      ALARM_LOW:'新しいブラウザの低血糖警報の初期設定です。血糖値がBG_TARGET_BOTTOMを下回ると発動します。onまたはoffを指定します。',
      ALARM_TIMEAGO_URGENT:'測定データがALARM_TIMEAGO_URGENT_MINS分以上届かない場合の緊急警報です。onまたはoffを指定します。',
      ALARM_TIMEAGO_URGENT_MINS:'最後の血糖測定から緊急警報を出すまでの時間を分で指定します。',
      ALARM_TIMEAGO_WARN:'測定データがALARM_TIMEAGO_WARN_MINS分以上届かない場合の警告です。onまたはoffを指定します。',
      ALARM_TIMEAGO_WARN_MINS:'最後の血糖測定から警告を出すまでの時間を分で指定します。',
      ALARM_TYPES:'simple（しきい値による警報）、predict（推移の予測による警報）、または両方を指定します。predictだけでは、下記の血糖しきい値を超えたことによる警報は出ません。',
      ALARM_URGENT_HIGH:'新しいブラウザの重度の高血糖警報の初期設定です。血糖値がBG_HIGHを超えると発動します。onまたはoffを指定します。',
      ALARM_URGENT_LOW:'新しいブラウザの重度の低血糖警報の初期設定です。血糖値がBG_LOWを下回ると発動します。onまたはoffを指定します。',
      API_SECRET:'APIの認証に使用する12文字以上の秘密の文字列です。十分に長いランダムな値を使用してください。',
      BG_HIGH:'重度の高血糖警報のしきい値です。DISPLAY_UNITSで指定したmg/dLまたはmmol/Lの単位で設定します。',
      BG_LOW:'重度の低血糖警報のしきい値です。DISPLAY_UNITSで指定したmg/dLまたはmmol/Lの単位で設定します。',
      BG_TARGET_BOTTOM:'低血糖警報のしきい値です。DISPLAY_UNITSで指定したmg/dLまたはmmol/Lの単位で設定します。',
      BG_TARGET_TOP:'高血糖警報のしきい値です。DISPLAY_UNITSで指定したmg/dLまたはmmol/Lの単位で設定します。',
      BOLUS_RENDER_OVER:'一定量以上の投与をグラフに表示する場合の、投与量の下限を単位数で指定します。',
      BRIDGE_PASSWORD:'Dexcom Shareから血糖データを受信するアカウントのパスワードです。ENABLEにbridgeを追加してください。',
      BRIDGE_SERVER:'Dexcom Shareの接続先です。米国はUS、米国外はEUを指定します。',
      BRIDGE_USER_NAME:'Dexcom Shareから血糖データを受信するアカウントの利用者名です。ENABLEにbridgeを追加してください。',
      CUSTOM_TITLE:'記録画面に表示する名前です。利用者や確認対象を区別する名前を設定できます。',
      DISPLAY_UNITS:'血糖値の表示単位です。mg/dlまたはmmol/L（mmolも可）を指定します。',
      ENABLE:'有効にする機能名を、小文字と半角スペース区切りで指定します。Dexcom Shareはbridge、MiniMed CareLinkはmmconnectを追加します。',
      MMCONNECT_USER_NAME:'CareLinkから血糖データを受信するアカウントの利用者名です。ENABLEにmmconnectを追加してください。',
      MMCONNECT_PASSWORD:'CareLinkから血糖データを受信するアカウントのパスワードです。ENABLEにmmconnectを追加してください。',
      MMCONNECT_SERVER:'CareLinkの接続先です。米国はUS、米国外はEUを指定します。',
      NIGHT_MODE:'夜間に画面を暗くする設定の初期値です。onまたはoffを指定します。',
      SHOW_PLUGINS:'最初から表示する有効な機能名を、小文字と半角スペース区切りで指定します。ENABLEとは別に、表示状態を設定します。',
      SHOW_RAWBG:'生の血糖データがある場合の表示設定です。always（常時）、never（表示しない）、noise（ノイズがある場合）を指定します。',
      THEME:'血糖グラフの色設定の初期値です。default、colors、colorblindfriendlyを指定します。',
      TIME_FORMAT:'時刻の表示形式の初期値です。12時間表示は12、24時間表示は24を指定します。',
      USE_NPM_INSTALL:'Herokuへの配備に必要な依存ファイルのインストール設定です。'
    };
    const env=JSON.parse(fs.readFileSync('app.json')).env;assert.deepEqual(Object.keys(descriptions).sort(),Object.keys(env).sort());
    change('app.json',[[['name'],'血糖みまもり'],[['repository'],'https://github.com/sera-inc/kettou-mimamori'],...Object.entries(descriptions).map(([key,value])=>[['env',key,'description'],value]),[['env','TIME_FORMAT','value'],'24'],[['env','LANGUAGE'],{description:'画面の表示言語です。日本語はjaを指定します。',value:'ja',required:false}]]);
    fs.writeFileSync(plan,JSON.stringify(records,null,2));
  }else throw Error('Use apply or verify');
}
