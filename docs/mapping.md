# 実装値とトークン対応表

2026-10-14 レポートの選択肢：チェック済みの疑似要素によってinline-flexの既定baselineが変わり、未選択と14pxずれるため、checkbox/radioを含むlabelのみ `vertical-align: middle` に統一する。配色・寸法・トークン原本・入力処理は変更しない。構造上の整列指定であり、新しいトークン値の追加はない。

2026-10-12：ユーザーがトークン選定・検証を委任。DADS blueを継承。

第三者のjQuery UI・colorbrewer原本は改変せず、Layer 3のテーマから包む。グラフの計算・形状を維持する構造値は専用Layer 2エイリアスに記録。未解決の値を推測で置換しない。

| ファイル・セレクタ | プロパティ | 元の値 | 対応トークン |
|---|---|---|---|
| static/css/main.css [class^="icon-"]:before, [class*=" icon-"]:before,
 [class^="plugicon-"]:before, [class*=" plugicon-"]:before | font-weight | `normal` | --app-font-weight-normal ※統合 |
| static/css/main.css body | font-family | `'Ubuntu', sans-serif` | --app-font-sans ※統合 |
| static/css/main.css body | background | `#000` | --app-surface-sunken ※統合 |
| static/css/main.css body | color | `#bdbdbd` | --app-text ※統合 |
| static/css/main.css .container | top | `45px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .container | z-index | `2` | --app-z-sticky ※統合 |
| static/css/main.css .ui-button | background-color | `grey` | --app-surface ※統合 |
| static/css/main.css .ui-button | border | `1px solid white` | --app-border ※統合 |
| static/css/main.css .ui-button | padding | `2px` | --app-space-0 ※統合 |
| static/css/main.css a, a:visited, a:link | color | `#2196f3` | --app-text-link ※統合 |
| static/css/main.css #container.announcing .customTitle | color | `orange` | --app-warning-text ※統合 |
| static/css/main.css #container.alarming.urgent .customTitle | color | `red` | --app-danger-text ※統合 |
| static/css/main.css #container.alarming.warning .customTitle | color | `yellow` | --app-warning-text ※統合 |
| static/css/main.css .primary | font-family | `'Ubuntu', Verdana, Helvetica, Arial, sans-serif` | --app-font-sans ※統合 |
| static/css/main.css .bgStatus | padding-right | `20px` | --app-space-2 ※統合 |
| static/css/main.css .urgent .bgButton | color | `red` | --app-danger-text ※統合 |
| static/css/main.css .warning .bgButton | color | `yellow` | --app-warning-text ※統合 |
| static/css/main.css .inrange .bgButton | color | `#4cff00` | --app-success-text ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `120px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `100px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `90px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-weight | `normal` | --app-font-weight-normal ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `90px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `90px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `30px` | --app-text-display-sm-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `34px` | --app-text-body-leading ※統合 |
| static/css/main.css .minorPills | font-size | `22px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .minorPills | line-height | `25px` | --app-text-body-leading ※統合 |
| static/css/main.css .minorPills | z-index | `500` | --app-z-toast ※統合 |
| static/css/main.css .majorPills > span:not(:first-child) | margin-left | `5px` | --app-space-05 ※統合 |
| static/css/main.css .minorPills > span:not(:first-child) | margin-left | `5px` | --app-space-05 ※統合 |
| static/css/main.css .pill | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/main.css .pill | border | `2px solid #808080` | --app-border ※統合 |
| static/css/main.css .pill | background | `#808080` | --app-surface ※統合 |
| static/css/main.css .pill | margin-bottom | `4px` | --app-space-05 ※統合 |
| static/css/main.css .pill | padding | `2px 0` | --app-space-0 ※統合 |
| static/css/main.css .pill em, .pill label | padding | `2px 3px` | --app-space-0 --app-space-05 ※統合 |
| static/css/main.css .pill em | font-weight | `bold` | --app-font-weight-bold ※統合 |
| static/css/main.css .pill em | background | `#000` | --app-surface ※統合 |
| static/css/main.css .pill em | border-radius | `3px` | --app-radius-xs ※統合 |
| static/css/main.css .pill label | color | `#000` | --app-text ※統合 |
| static/css/main.css .container .pill.warn em | color | `yellow` | --app-warning-text ※統合 |
| static/css/main.css .container .pill.urgent em | color | `red` | --app-danger-text ※統合 |
| static/css/main.css .alarming-timeago .timeago.pill.warn | border-color | `yellow` | --app-warning-text ※統合 |
| static/css/main.css .alarming-timeago .timeago.pill.warn label | background | `yellow` | --app-warning-bg ※統合 |
| static/css/main.css .alarming-timeago .timeago.pill.urgent | border-color | `red` | --app-danger-text ※統合 |
| static/css/main.css .alarming-timeago .timeago.pill.urgent label | background | `red` | --app-danger-bg ※統合 |
| static/css/main.css .status | color | `#808080` | --app-text ※統合 |
| static/css/main.css .status | font-size | `100px` | --app-text-display-size ※統合 |
| static/css/main.css .statusPills | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .statusPills | line-height | `23px` | --app-text-body-leading ※統合 |
| static/css/main.css .statusPills | margin-left | `5px` | --app-space-05 ※統合 |
| static/css/main.css .statusPills .pill | background | `#808080` | --app-surface ※統合 |
| static/css/main.css .statusPills .pill | border-color | `#808080` | --app-border ※統合 |
| static/css/main.css .statusPills .pill | margin-right | `5px` | --app-space-05 ※統合 |
| static/css/main.css .statusPills .pill em | color | `#bdbdbd` | --app-text ※統合 |
| static/css/main.css #chartContainer | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css #chartContainer | background | `#111` | --app-surface-sunken ※統合 |
| static/css/main.css #chartContainer | margin | `2px` | --app-space-0 ※統合 |
| static/css/main.css #silenceBtn, #viewMenu | z-index | `99` | --app-z-sticky ※統合 |
| static/css/main.css #silenceBtn, #viewMenu | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/main.css #silenceBtn, #viewMenu | border | `2px solid #bdbdbd` | --app-border ※統合 |
| static/css/main.css #viewMenu | left | `150px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css #viewMenu | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css #viewMenu li label input[type="checkbox"] | height | `14px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css #viewMenu li label input[type="checkbox"] | margin-right | `5px` | --app-space-05 ※統合 |
| static/css/main.css #silenceBtn a | font-size | `40px` | --app-text-display-sm-size ※統合 |
| static/css/main.css .bgButton | margin | `10px` | --app-space-1 ※統合 |
| static/css/main.css .bgButton | border | `2px solid #000` | --app-border ※統合 |
| static/css/main.css .bgButton | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/main.css .bgButton | width | `360px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .pill.rawbg | border-radius | `2px` | --app-radius-xs ※統合 |
| static/css/main.css .pill.rawbg | border | `1px solid #808080` | --app-border ※統合 |
| static/css/main.css .pill.rawbg em | color | `white` | --app-text ※統合 |
| static/css/main.css .pill.rawbg em | background-color | `black` | --app-surface ※統合 |
| static/css/main.css .pill.rawbg em | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .pill.rawbg em | padding | `0 2px` | --app-space-0 ※統合 |
| static/css/main.css .pill.rawbg label | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css .pill.rawbg label | padding | `0 2px` | --app-space-0 ※統合 |
| static/css/main.css .alarming .bgButton | border-color | `#bdbdbd` | --app-border ※統合 |
| static/css/main.css .alarming .bgButton | color | `#000` | --app-text ※統合 |
| static/css/main.css .alarming .bgButton | box-shadow | `2px 2px 0 #ddd` | --app-shadow-raised ※統合 |
| static/css/main.css .alarming.urgent .bgButton | background-color | `red` | --app-danger-bg ※統合 |
| static/css/main.css .alarming.warning .bgButton | background-color | `yellow` | --app-warning-bg ※統合 |
| static/css/main.css .alarming .bgButton:active | border | `2px solid #bdbdbd` | --app-border ※統合 |
| static/css/main.css .button | background | `#ababab` | --app-surface ※統合 |
| static/css/main.css .button | margin | `10px auto` | --app-space-1 ※統合 |
| static/css/main.css .tooltip | color | `#444` | --app-text ※統合 |
| static/css/main.css .tooltip | padding | `4px` | --app-space-05 ※統合 |
| static/css/main.css .tooltip | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css .tooltip | line-height | `15px` | --app-text-body-leading ※統合 |
| static/css/main.css .tooltip | background | `white` | --app-surface ※統合 |
| static/css/main.css .tooltip | border-radius | `8px` | --app-radius-md ※統合 |
| static/css/main.css .tooltip | min-width | `150px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .tooltip | max-width | `400px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .focus-range | margin | `4px` | --app-space-05 ※統合 |
| static/css/main.css .focus-range | color | `#808080` | --app-text ※統合 |
| static/css/main.css .focus-range li | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .focus-range li | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/main.css .focus-range li | border | `2px solid #000` | --app-border ※統合 |
| static/css/main.css .focus-range .selected | border-color | `#808080` | --app-border ※統合 |
| static/css/main.css .focus-range .selected | color | `#000` | --app-text ※統合 |
| static/css/main.css .focus-range .selected | background | `#808080` | --app-surface ※統合 |
| static/css/main.css .toolbar-title | padding | `0 10px` | --app-space-1 ※統合 |
| static/css/main.css .page-content | padding | `10px` | --app-space-1 ※統合 |
| static/css/main.css .authentication-status | padding | `10px` | --app-space-1 ※統合 |
| static/css/main.css .authentication-status | border-top | `1px solid #bdbdbd` | --app-border ※統合 |
| static/css/main.css .authentication-status a | color | `#2196f3` | --app-text-link ※統合 |
| static/css/main.css .authentication-status .small | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus | width | `450px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `80px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `80px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `70px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `24px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus .minorPills | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .minorPills | line-height | `18px` | --app-text-body-leading ※統合 |
| static/css/main.css .status | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .status | padding-top | `8px` | --app-space-1 ※統合 |
| static/css/main.css .statusPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .statusPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .focus-range li | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css #silenceBtn a | font-size | `30px` | --app-text-display-sm-size ※統合 |
| static/css/main.css #chartContainer | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css .x.axis | font-size | `2.5vmin` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus | padding | `0 0 20px 0` | --app-space-2 ※統合 |
| static/css/main.css .pill.rawbg em | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css .pill.rawbg label | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `60px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `50px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus .minorPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .minorPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/main.css .status | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .status | width | `250px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .bgStatus | width | `250px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .bgButton | margin | `5px` | --app-space-05 ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `70px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `60px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | padding-left | `20px` | --app-space-2 ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `60px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `60px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus .minorPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .minorPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/main.css #silenceBtn a | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css #viewMenu | top | `170px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css #viewMenu | right | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .status | font-size | `20px` | --app-text-heading-sm-size ※統合 |
| static/css/main.css .statusPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .statusPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/main.css .focus-range | top | `60px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .focus-range | right | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css #chartContainer | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/main.css .y.axis | font-size | `2.5vmin` | --app-text-body-size ※統合 |
| static/css/main.css #chartContainer | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css #container #toolbar | margin | `0px` | --app-space-0 ※統合 |
| static/css/main.css #buttonbar | margin-right | `0px` | --app-space-0 ※統合 |
| static/css/main.css #buttonbar | padding-right | `15px` | --app-space-2 ※統合 |
| static/css/main.css #buttonbar | margin-top | `15px` | --app-space-2 ※統合 |
| static/css/main.css #buttonbar | height | `44px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css #buttonbar | z-index | `500` | --app-z-toast ※統合 |
| static/css/main.css #buttonbar | width | `400px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .container | top | `15px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .container | padding-bottom | `20px` | --app-space-2 ※統合 |
| static/css/main.css #chartContainer | font-size | `10px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `60px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `70px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `50px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus .minorPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .minorPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/main.css .status | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .status | padding-top | `5px` | --app-space-05 ※統合 |
| static/css/main.css .statusPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .statusPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus | width | `220px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .bgStatus .currentBG | font-size | `60px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .currentBG | line-height | `60px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .currentBG.bg-limit, .bgStatus .currentBG.icon-hourglass | font-size | `60px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | font-size | `50px` | --app-text-display-size ※統合 |
| static/css/main.css .bgStatus .pill.direction | line-height | `50px` | --app-text-display-leading ※統合 |
| static/css/main.css .bgStatus .majorPills | font-size | `15px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .majorPills | line-height | `17px` | --app-text-body-leading ※統合 |
| static/css/main.css .bgStatus .minorPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .bgStatus .minorPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/main.css #silenceBtn | right | `-25px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .focus-range | top | `40px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .focus-range | right | `35px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/main.css .statusPills | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/main.css .statusPills | line-height | `13px` | --app-text-body-leading ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | font-weight | `bolder` | --app-font-weight-bold ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | background-color | `#ccc` | --app-surface ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | padding | `5px 10px` | --app-space-05 --app-space-1 ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | border | `2px solid #aaa` | --app-border ※統合 |
| static/css/drawer.css #drawer button, #treatmentDrawer button, #boluscalcDrawer button | box-shadow | `2px 2px 0 #eee` | --app-shadow-raised ※統合 |
| static/css/drawer.css #drawer | background-color | `#666` | --app-surface ※統合 |
| static/css/drawer.css #drawer | border-left | `1px solid #999` | --app-border ※統合 |
| static/css/drawer.css #drawer | box-shadow | `inset 4px 4px 5px 0 rgba(50, 50, 50, 0.75)` | --app-shadow-raised ※統合 |
| static/css/drawer.css #drawer | color | `#eee` | --app-text ※統合 |
| static/css/drawer.css #drawer | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/drawer.css #drawer | margin-top | `45px` | --app-space-6 ※統合 |
| static/css/drawer.css #drawer | right | `-200px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #drawer | z-index | `1` | --app-z-drawer ※統合 |
| static/css/drawer.css #drawer a, #treatmentDrawer a | color | `white` | --app-text-link ※統合 |
| static/css/drawer.css input[type=number]:invalid | background-color | `#FFCCCC` | --app-danger-bg ※統合 |
| static/css/drawer.css #drawer .actions | margin | `10px 2px` | --app-space-1 --app-space-0 ※統合 |
| static/css/drawer.css #drawer .actions a | padding | `10px 0` | --app-space-1 ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | background-color | `#666` | --app-surface ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | border-left | `1px solid #999` | --app-border ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | box-shadow | `inset 4px 4px 5px 0 rgba(50, 50, 50, 0.75)` | --app-shadow-raised ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | color | `#eee` | --app-text ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | margin-top | `45px` | --app-space-6 ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | right | `-200px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer, #adminNotifiesDrawer | z-index | `1` | --app-z-drawer ※統合 |
| static/css/drawer.css #adminNotifyContent | margin | `10px` | --app-space-1 ※統合 |
| static/css/drawer.css .adminNotifyMessage | margin-left | `10px` | --app-space-1 ※統合 |
| static/css/drawer.css .adminNotifyMessageAdditionalInfo | margin-left | `10px` | --app-space-1 ※統合 |
| static/css/drawer.css .adminNotifyMessageAdditionalInfo | font-size | `11px` | --app-text-body-size ※統合 |
| static/css/drawer.css #treatmentDrawer .left-column span | width | `110px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer .left-column span | line-height | `22px` | --app-text-body-leading ※統合 |
| static/css/drawer.css #treatmentDrawer fieldset fieldset .left-column span | width | `96px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer .left-column input, #treatmentDrawer .left-column select | width | `140px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer .extra-space | padding-top | `10px` | --app-space-1 ※統合 |
| static/css/drawer.css .timeago-mins | width | `25px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #eventTime | padding-bottom | `15px` | --app-space-2 ※統合 |
| static/css/drawer.css #eventTime > span | width | `105px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #eventTime > span | line-height | `22px` | --app-text-body-leading ※統合 |
| static/css/drawer.css #treatmentDrawer .eventdate | width | `130px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer .eventtime | width | `110px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #eventTime label span | width | `45px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #eventTime label span | line-height | `22px` | --app-text-body-leading ※統合 |
| static/css/drawer.css #treatmentDrawer #glucoseValue | width | `230px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #treatmentDrawer #notes | width | `250px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #about | margin-bottom | `55px` | --app-space-6 ※統合 |
| static/css/drawer.css #about div | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/drawer.css #about .links | margin | `10px` | --app-space-1 ※統合 |
| static/css/drawer.css #about a | color | `#fff` | --app-text-link ※統合 |
| static/css/drawer.css form | padding | `0 10px` | --app-space-1 ※統合 |
| static/css/drawer.css legend | font-size | `1.1em` | --app-text-body-size ※統合 |
| static/css/drawer.css dd.numbers input | width | `50px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css dd.numbers label | width | `50px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css h1, legend,
#toolbar .customTitle,
#about .appName,
#about .version | font-weight | `bold` | --app-font-weight-bold ※統合 |
| static/css/drawer.css h1, legend,
#toolbar .customTitle,
#about .appName,
#about .version | text-shadow | `1px 1px 2px rgba(0, 0, 0, 0.5)` | 装飾影を除去 ※統合 |
| static/css/drawer.css #about .appName | font-size | `1em` | --app-text-body-size ※統合 |
| static/css/drawer.css #about .version | font-size | `1.25em` | --app-text-body-size ※統合 |
| static/css/drawer.css #toolbar | text-shadow | `0 0 5px black` | 装飾影を除去 ※統合 |
| static/css/drawer.css #toolbar | height | `44px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #toolbar | margin | `0 0 10px` | --app-space-1 ※統合 |
| static/css/drawer.css #toolbar | padding | `0 15px 0 40px` | --app-space-2 --app-space-5 ※統合 |
| static/css/drawer.css #toolbar | background | `url("../images/logo2.png") no-repeat 3px center #333` | --app-surface ※統合 |
| static/css/drawer.css #toolbar | border-bottom | `1px solid #999` | --app-border ※統合 |
| static/css/drawer.css #toolbar .customTitle | color | `#ccc` | --app-text ※統合 |
| static/css/drawer.css #toolbar .customTitle | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/drawer.css #toolbar .button-close | color | `#404040` | --app-text ※統合 |
| static/css/drawer.css #toolbar .button-close | height | `20px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #toolbar .button-close | width | `20px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #toolbar .button-close | padding | `5px` | --app-space-05 ※統合 |
| static/css/drawer.css #toolbar .button-close | right | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #toolbar .button-close | background | `grey` | --app-surface ※統合 |
| static/css/drawer.css #toolbar .button-close | border | `2px solid #404040` | --app-border ※統合 |
| static/css/drawer.css #toolbar .button-close | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/drawer.css #toolbar .button-close + #buttonbar | margin-right | `40px` | --app-space-5 ※統合 |
| static/css/drawer.css #buttonbar a,
#buttonbar i | color | `#ccc` | --app-text-link ※統合 |
| static/css/drawer.css #buttonbar a,
#buttonbar i | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/drawer.css #buttonbar a,
#buttonbar i | height | `44px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #buttonbar a,
#buttonbar i | line-height | `44px` | --app-text-body-leading ※統合 |
| static/css/drawer.css #buttonbar .selected | color | `red` | --app-danger-text ※統合 |
| static/css/drawer.css #buttonbar a | width | `34px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #buttonbar i | padding-left | `12px` | --app-space-1 ※統合 |
| static/css/drawer.css #notification | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/drawer.css #notification | top | `4px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #notification | z-index | `99` | --app-z-sticky ※統合 |
| static/css/drawer.css #notification.info a | background | `#00f` | --app-surface ※統合 |
| static/css/drawer.css #notification.info a | color | `#fff` | --app-text-link ※統合 |
| static/css/drawer.css #notification.warn a | background | `#cc0` | --app-warning-bg ※統合 |
| static/css/drawer.css #notification.warn a | color | `#000` | --app-warning-text ※統合 |
| static/css/drawer.css #notification.success a | background | `#090` | --app-success-bg ※統合 |
| static/css/drawer.css #notification.success a | color | `#fff` | --app-success-text ※統合 |
| static/css/drawer.css #notification.urgent a | background | `#c00` | --app-danger-bg ※統合 |
| static/css/drawer.css #notification.urgent a | color | `#fff` | --app-danger-text ※統合 |
| static/css/drawer.css #notification a | background | `#c00` | --app-surface ※統合 |
| static/css/drawer.css #notification a | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/drawer.css #notification a | color | `#fff` | --app-text-link ※統合 |
| static/css/drawer.css #notification a | height | `20px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css .experiments a | color | `#fff` | --app-text-link ※統合 |
| static/css/drawer.css .experiments a | font-size | `1.5em` | --app-text-body-size ※統合 |
| static/css/drawer.css .navigation a | background-color | `#808080` | --app-surface ※統合 |
| static/css/drawer.css .navigation a | padding | `5px` | --app-space-05 ※統合 |
| static/css/drawer.css .navigation a | margin | `10px 0` | --app-space-1 ※統合 |
| static/css/drawer.css .navigation a:hover | background-color | `#989898` | --app-surface ※統合 |
| static/css/drawer.css #boluscalcDrawer | background-color | `#666` | --app-surface ※統合 |
| static/css/drawer.css #boluscalcDrawer | border-left | `1px solid #999` | --app-border ※統合 |
| static/css/drawer.css #boluscalcDrawer | box-shadow | `inset 4px 4px 5px 0 rgba(50, 50, 50, 0.75)` | --app-shadow-raised ※統合 |
| static/css/drawer.css #boluscalcDrawer | color | `#eee` | --app-text ※統合 |
| static/css/drawer.css #boluscalcDrawer | font-size | `16px` | --app-text-body-size ※統合 |
| static/css/drawer.css #boluscalcDrawer | margin-top | `45px` | --app-space-6 ※統合 |
| static/css/drawer.css #boluscalcDrawer | right | `-200px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #boluscalcDrawer | width | `320px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/drawer.css #boluscalcDrawer | z-index | `1` | --app-z-drawer ※統合 |
| static/css/drawer.css #boluscalcDrawer a | color | `white` | --app-text-link ※統合 |
| static/css/drawer.css #boluscalcDrawer a | font-size | `12px` | --app-text-body-size ※統合 |
| static/css/drawer.css #boluscalcDrawer .insulincalculation | background | `gray` | --app-surface ※統合 |
| static/css/drawer.css #boluscalcDrawer .border_bottom td | border-bottom | `1pt solid #eee` | --app-border ※統合 |
| static/css/drawer.css #boluscalcDrawer .foodinput | background | `#505050` | --app-surface ※統合 |
| static/css/drawer.css #boluscalcDrawer .foodinput | margin | `10px` | --app-space-1 ※統合 |
| static/css/dropdown.css .dropdown-menu | font-size | `200%` | --app-text-display-size ※統合 |
| static/css/dropdown.css .dropdown-menu | right | `8px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/dropdown.css .dropdown-menu li a, .dropdown-menu li label | background | `#BBBBBB` | --app-surface ※統合 |
| static/css/dropdown.css .dropdown-menu li a, .dropdown-menu li label | color | `#24313C` | --app-text-link ※統合 |
| static/css/dropdown.css .dropdown-menu li a, .dropdown-menu li label | padding | `2px 10px` | --app-space-0 --app-space-1 ※統合 |
| static/css/dropdown.css .dropdown-menu li a:hover | background | `#EEEEFF` | --app-surface ※統合 |
| static/css/sgv.css body | fill | `#fff` | --app-text ※統合 |
| static/css/sgv.css .axis path,
.axis line | stroke | `#ffffff` | --app-border ※統合 |
| static/css/sgv.css .grid path, .axis line | stroke | `#bdbdbd` | --app-border ※統合 |
| static/css/sgv.css .brush .extent | stroke | `#ffffff` | --app-border ※統合 |
| static/css/profile.css #profile-editor h1 | margin | `10px` | --app-space-1 ※統合 |
| static/css/profile.css #pe_form input[type="text"], #pe_form input[type="number"] | width | `60px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/profile.css #pe_submit | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| static/css/profile.css #pe_submit | font-weight | `bolder` | --app-font-weight-bold ※統合 |
| static/css/profile.css #pe_submit | background-color | `#ccc` | --app-surface ※統合 |
| static/css/profile.css #pe_submit | padding | `5px 10px` | --app-space-05 --app-space-1 ※統合 |
| static/css/profile.css #pe_submit | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/profile.css #pe_submit | border | `2px solid #aaa` | --app-border ※統合 |
| static/css/profile.css #pe_submit | box-shadow | `2px 2px 0 #eee` | --app-shadow-raised ※統合 |
| static/css/profile.css #pe_submit | margin | `20px 0` | --app-space-2 ※統合 |
| static/css/profile.css .pe_stored_profile | background-color | `#222` | --app-surface ※統合 |
| static/css/food.css #food-editor h1 | left | `50px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/food.css #fe_form | margin-left | `10px` | --app-space-1 ※統合 |
| static/css/food.css #fe_form | margin-right | `10px` | --app-space-1 ※統合 |
| static/css/food.css .width50px | width | `50px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/food.css .width100px | width | `100px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/food.css .width150px | width | `150px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/food.css .width200px | width | `200px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/food.css .sortablequickpick | background-color | `#383838` | --app-surface ※統合 |
| static/css/food.css .sortablequickpick | border-radius | `8px` | --app-radius-md ※統合 |
| static/css/food.css .draggablefood | background-color | `gray` | --app-surface ※統合 |
| static/css/food.css .draggablefood | border | `2px solid #000` | --app-border ※統合 |
| static/css/food.css .fe_foodinsideqp | background-color | `gray` | --app-surface ※統合 |
| static/css/report.css body | font-family | `'Open Sans', Helvetica, Arial, sans-serif` | --app-font-sans ※統合 |
| static/css/report.css body | background | `white` | --app-surface-sunken ※統合 |
| static/css/report.css body | color | `black` | --app-text ※統合 |
| static/css/report.css #explanation | font | `11px verdana, arial, sans-serif` | --app-font-weight-normal --app-text-body-size --app-text-body-leading --app-font-sans ※統合 |
| static/css/report.css #tabnav | font | `bold 11pt verdana, arial, sans-serif` | --app-font-weight-normal --app-text-body-size --app-text-body-leading --app-font-sans ※統合 |
| static/css/report.css #tabnav | border-bottom | `1px solid #6c6` | --app-border ※統合 |
| static/css/report.css #tabnav | padding | `0 0 0 15px` | --app-space-2 ※統合 |
| static/css/report.css #tabnav li | padding | `10px 15px` | --app-space-1 --app-space-2 ※統合 |
| static/css/report.css #tabnav li | border-top | `1px solid #6c6` | --app-border ※統合 |
| static/css/report.css #tabnav li | border-right | `1px solid #6c6` | --app-border ※統合 |
| static/css/report.css #tabnav li | background-color | `#cfc` | --app-surface ※統合 |
| static/css/report.css #tabnav li | color | `#666` | --app-text ※統合 |
| static/css/report.css #tabnav li | margin | `0 0 -1px 0` | --app-preserved-geometry-5f0b2c50 ※統合 |
| static/css/report.css #tabnav li:first-child | border-left | `1px solid #6c6` | --app-border ※統合 |
| static/css/report.css #tabnav .selected | background | `#fff` | --app-surface ※統合 |
| static/css/report.css #tabnav .selected | border-bottom | `1px solid #fff` | --app-border ※統合 |
| static/css/report.css #tabnav li:hover | background | `#9f9` | --app-surface ※統合 |
| static/css/report.css .tooltip | color | `#444` | --app-text ※統合 |
| static/css/report.css .tooltip | padding | `4px` | --app-space-05 ※統合 |
| static/css/report.css .tooltip | font-size | `14px` | --app-text-body-size ※統合 |
| static/css/report.css .tooltip | line-height | `15pt` | --app-text-body-leading ※統合 |
| static/css/report.css .tooltip | background | `white` | --app-surface ※統合 |
| static/css/report.css .tooltip | border | `2px solid black` | --app-border ※統合 |
| static/css/report.css .tooltip | border-radius | `8px` | --app-radius-md ※統合 |
| static/css/report.css .tooltip | min-width | `150px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/report.css .tooltip | max-width | `400px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/report.css main | padding | `15px` | --app-space-2 ※統合 |
| static/css/report.css input[type=date],
input[type=text],
input[type=number],
select | font | `13px verdana, arial, sans-serif` | --app-font-weight-normal --app-text-body-size --app-text-body-leading --app-font-sans ※統合 |
| static/css/report.css label | margin-right | `7px` | --app-space-1 ※統合 |
| static/css/report.css #rp_to | margin-right | `10px` | --app-space-1 ※統合 |
| static/css/report.css .presetdates | margin-right | `8px` | --app-space-1 ※統合 |
| static/css/report.css #rp_show | background-color | `#cfc` | --app-surface ※統合 |
| static/css/report.css #rp_show | border | `1px solid #6c6` | --app-border ※統合 |
| static/css/report.css #rp_show | color | `#666` | --app-text ※統合 |
| static/css/report.css #rp_show | padding | `10px` | --app-space-1 ※統合 |
| static/css/report.css #rp_show | font-weight | `bold` | --app-font-weight-bold ※統合 |
| static/css/report.css #rp_show | font-size | `12pt` | --app-text-body-size ※統合 |
| static/css/admin.css #admin-tools h1 | margin | `10px` | --app-space-1 ※統合 |
| static/css/admin.css #admin_placeholder | margin-left | `20px` | --app-space-2 ※統合 |
| static/css/admin.css #admin_placeholder | margin-right | `20px` | --app-space-2 ※統合 |
| static/css/admin.css #admin_placeholder fieldset | background-color | `#383838` | --app-surface ※統合 |
| static/css/admin.css #admin_placeholder fieldset | border-radius | `8px` | --app-radius-md ※統合 |
| static/css/admin.css #admin_placeholder button | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| static/css/admin.css #admin_placeholder button | font-weight | `bolder` | --app-font-weight-bold ※統合 |
| static/css/admin.css #admin_placeholder button | background-color | `#ccc` | --app-surface ※統合 |
| static/css/admin.css #admin_placeholder button | padding | `5px 10px` | --app-space-05 --app-space-1 ※統合 |
| static/css/admin.css #admin_placeholder button | border-radius | `5px` | --app-radius-xs ※統合 |
| static/css/admin.css #admin_placeholder button | border | `2px solid #aaa` | --app-border ※統合 |
| static/css/admin.css #admin_placeholder button | box-shadow | `2px 2px 0 #eee` | --app-shadow-raised ※統合 |
| static/css/admin.css #admin_placeholder button | margin-top | `20px` | --app-space-2 ※統合 |
| static/css/admin.css #admin_placeholder button | margin-bottom | `10px` | --app-space-1 ※統合 |
| static/css/admin.css #admin_placeholder button | margin-right | `20px` | --app-space-2 ※統合 |
| static/css/jquery.tooltips.css .tooltip strong, .tooltip b | font-weight | `700` | --app-font-weight-bold ※統合 |
| static/css/jquery.tooltips.css .tooltip | font-size | `10px` | --app-text-body-size ※統合 |
| static/css/jquery.tooltips.css .tooltip | padding | `3px 5px` | --app-space-05 --app-space-05 ※統合 |
| static/css/jquery.tooltips.css .tooltip | z-index | `9999` | --app-z-popover ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | background-color | `#000` | --app-surface ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | color | `#fff` | --app-text ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | max-width | `200px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | padding | `3px 8px` | --app-space-05 --app-space-1 ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | box-shadow | `0 0 5px 0 black` | --app-shadow-raised ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | border-radius | `3px` | --app-radius-xs ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | -moz-border-radius | `3px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-inner | -webkit-border-radius | `3px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow | line-height | `0` | --app-text-body-leading ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow | border | `5px dashed #000` | --app-border ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow-n | border-bottom-color | `#000` | --app-border ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow-s | border-top-color | `#000` | --app-border ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow-e | border-left-color | `#000` | --app-border ※統合 |
| static/css/jquery.tooltips.css .tooltip .tooltip-arrow-w | border-right-color | `#000` | --app-border ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-n .tooltip-arrow | top | `0px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-n .tooltip-arrow | margin-left | `-5px` | --app-preserved-geometry-9d2a3058 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-nw .tooltip-arrow | left | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-ne .tooltip-arrow | right | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-s .tooltip-arrow | margin-left | `-5px` | --app-preserved-geometry-9d2a3058 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-sw .tooltip-arrow | left | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-se .tooltip-arrow | right | `10px` | 保留なし：構造寸法を維持 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-e .tooltip-arrow | margin-top | `-5px` | --app-preserved-geometry-c1bff830 ※統合 |
| static/css/jquery.tooltips.css .tooltip.tooltip-w .tooltip-arrow | margin-top | `-5px` | --app-preserved-geometry-c1bff830 ※統合 |
| views/clockviews/clock-shared.css body | font-family | `'Open Sans', Arial, Helvetica, sans-serif` | --app-font-sans ※統合 |
| views/clockviews/clock-shared.css body | color | `grey` | --app-text ※統合 |
| views/clockviews/clock-shared.css body | background-color | `black` | --app-surface-sunken ※統合 |
| views/clockviews/clock-shared.css #inner div | line-height | `1em` | --app-text-body-leading ※統合 |
| views/clockviews/clock-shared.css #errorMessage | font-size | `25em` | --app-text-heading-lg-size ※統合 |
| views/clockviews/clock-shared.css .close | color | `white` | --app-text ※統合 |
| views/clockviews/clock-shared.css .close | font | `4em 'Open Sans'` | --app-font-weight-normal --app-text-body-size --app-text-body-leading --app-font-sans ※統合 |
| views/clockviews/clock-shared.css .close | right | `20px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-shared.css .close | z-index | `10` | --app-z-sticky ※統合 |
| views/clockviews/clock-config.css #config-form | top | `10px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-config.css #config-form | left | `10px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-config.css #config-form | width | `250px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-config.css #config-form | min-width | `220px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-config.css #config-form | background | `white` | --app-surface ※統合 |
| views/clockviews/clock-config.css #config-form | color | `black` | --app-text ※統合 |
| views/clockviews/clock-config.css #config-form | font-size | `10px` | --app-text-body-size ※統合 |
| views/clockviews/clock-config.css #config-form p | margin | `15px` | --app-space-2 ※統合 |
| views/clockviews/clock-config.css input.elmt | width | `120px` | 保留なし：構造寸法を維持 ※統合 |
| views/clockviews/clock-config.css #facename | font-size | `7px` | --app-text-body-size ※統合 |
| views/clockviews/clock-config.css #clocklink | font-size | `18px` | --app-text-heading-sm-size ※統合 |
| views/clockviews/clock-config.css #clocklink:link, #clocklink:visited | background-color | `#f44336` | --app-surface ※統合 |
| views/clockviews/clock-config.css #clocklink:link, #clocklink:visited | color | `white` | --app-text-link ※統合 |
| views/clockviews/clock-config.css #clocklink:link, #clocklink:visited | padding | `14px 25px` | --app-space-2 --app-space-3 ※統合 |
| views/clockviews/clock-config.css #clocklink:hover, #clocklink:active | background-color | `red` | --app-danger-bg ※統合 |

## Phase 4ドロワーの動的スタイル（2026-10-13追加選定）

ユーザーから委任されたトークン選定として、ドロワー実操作後に残った動的スタイルを文脈で確認。色に対応する既存の時間表示・入力値・計算・エラー判定は維持する。

|参照箇所|用途|既存値|対応トークン|
|---|---|---|---|
|lib/client/boluscalc.js #bc_retro（過去）|過去日時の強調。RETRO MODEのテキストを保持|red|--app-danger-bg ※統合|
|lib/client/boluscalc.js #bc_retro（未来）|未来日時の情報表示。IN THE FUTUREのテキストを保持|blue|--app-info-bg ※統合|
|lib/client/boluscalc.js #bc_bg|未測定/古い血糖の入力強調|red|--app-danger-bg ※統合|
|lib/client/boluscalc.js #bc_carbs|非数値の糖質入力強調|red|--app-danger-bg ※統合|
|lib/client/boluscalc.js #bc_inzulinbgtd|計算に必要なプロフィール値が欠損|red|--app-danger-bg ※統合|
|lib/client/boluscalc.js #bc_inzulincarbstd|糖質比が欠損|red|--app-danger-bg ※統合|
|lib/client/boluscalc.js 食品選択dialog|入れ子dialogの影|20px 20px 20px 0px black|--app-shadow-overlay ※統合|
|lib/client/adminnotifiesclient.js お知らせの操作|管理者通知の注意色|red|--app-danger-text ※統合|

## Phase 5コントラスト検査での追加選定

|参照箇所|用途|既存値|対応トークン|
|---|---|---|---|
|static/css/drawer.css .insulintotalcalculation|計算結果の強調面|Sienna|--app-primary-bg ※統合（文字は--app-text）|
|static/css/drawer.css .border_bottom td|入力表の区切り|1pt|1px（DADSの境界寸法）|
|lib/report_plugins/daytoday.js Insulin/IOB/Insulin distributionの凡例文字|各系列の読みやすい名称|blue;opacity:0.5|--app-primary、opacity:1 ※統合|
|lib/report_plugins/daytoday.js Carbs/COB/BG Checkの凡例文字|各系列の読みやすい名称|red/#ff0000;opacity:0.5|--app-danger-text、opacity:1 ※統合|
|lib/report_plugins/daytoday.js Basal rateの凡例文字|基礎系列の名称|#0099ff;opacity:0.5|--app-info-text、opacity:1 ※統合|
|lib/report_plugins/daytoday.js Rawの凡例文字|未加工系列の名称|gray;opacity:1|--app-text-muted ※統合|
|lib/report_plugins/daytoday.js Predictions/OpenAPSの凡例文字|予測系列の名称|sienna;opacity:0.5|--app-warning-text、opacity:1 ※統合|

この追加は凡例文字・面・区切りの検査を対象とする。Flotの実系列色は別途、合成データと描画ライブラリで検証する。凡例文字の修正だけで全グラフの移行完了を宣言しない。

## レポート描画と埋め込みstyle（2026-10-13追加選定）

校正パレットの実ブラウザー検証で、6/9/11のinkと淡色surfaceの組み合わせが文字用4.5:1を満たさなかったため、反映前に追加選定：`--app-chart-cal-ink-6`はblue-600→blue-700、`--app-chart-cal-ink-9`はorange-700→orange-1000、`--app-chart-cal-bg-11`はgreen-100→green-50。原本トークンを変えず、製品用Layer 2エイリアスのみを調整。12カテゴリのインデックスと記録の対応を維持する。初回測定はverification/report-styles/theme-initial-observation.jsonに保存。

内部の色分類・灰色raw識別・透明sentinelは維持し、表示境界で解決。Flotには計算済みトークン値、SVG/CSSにはsemantic varを使用。書体はDense、構造pxは等価remへ変換。

|参照箇所|既存の記述|選定した置換|用途|
|---|---|---|---|
| lib/report_plugins/calibrations.js:22 | `'<div style="width:50%;height:500px;float:left;overflow:scroll;overflow-x:hidden;" id="calibrations-list"></div>'` | `"<div style=\"width:50%;height:31.25rem;float:left;overflow:scroll;overflow-x:hidden;\" id=\"calibrations-list\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/calibrations.js:63 | `'Aqua'` | `reportTheme.color("--app-chart-cal-ink-1")` | --app-chart-cal-ink-1 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Blue'` | `reportTheme.color("--app-chart-cal-ink-2")` | --app-chart-cal-ink-2 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Brown'` | `reportTheme.color("--app-chart-cal-ink-3")` | --app-chart-cal-ink-3 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Chartreuse'` | `reportTheme.color("--app-chart-cal-ink-4")` | --app-chart-cal-ink-4 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Coral'` | `reportTheme.color("--app-chart-cal-ink-5")` | --app-chart-cal-ink-5 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'CornflowerBlue'` | `reportTheme.color("--app-chart-cal-ink-6")` | --app-chart-cal-ink-6 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'DarkCyan'` | `reportTheme.color("--app-chart-cal-ink-7")` | --app-chart-cal-ink-7 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'DarkMagenta'` | `reportTheme.color("--app-chart-cal-ink-8")` | --app-chart-cal-ink-8 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'DarkOrange'` | `reportTheme.color("--app-chart-cal-ink-9")` | --app-chart-cal-ink-9 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Fuchsia'` | `reportTheme.color("--app-chart-cal-ink-10")` | --app-chart-cal-ink-10 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Green'` | `reportTheme.color("--app-chart-cal-ink-11")` | --app-chart-cal-ink-11 ※統合 |
| lib/report_plugins/calibrations.js:63 | `'Yellow'` | `reportTheme.color("--app-chart-cal-ink-12")` | --app-chart-cal-ink-12 ※統合 |
| lib/report_plugins/calibrations.js:70 | `(!e.eventType ? colors[colorindex] : 'White')` | `(!e.eventType ? "var(--app-chart-cal-bg-" + (colorindex + 1) + ")" : "var(--app-surface)")` | Calibration table gets pale category surfaces while plotted ink stays distinct; same twelve indices |
| lib/report_plugins/calibrations.js:145 | `'WhiteSmoke'` | `"var(--app-surface-sunken)"` | --app-surface-sunken ※統合 |
| lib/report_plugins/calibrations.js:188 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/calibrations.js:196 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/calibrations.js:209 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/calibrations.js:219 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/calibrations.js:261 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/dailystats.js:27 | `'  width:80px;'` | `"  width:5rem;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/dailystats.js:28 | `'  border: 1px #ccc solid;'` | `"  border: 1px var(--app-border) solid;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/dailystats.js:30 | `'  padding: 1px;'` | `"  padding: 0.0625rem;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/dailystats.js:78 | `'<td class="tdborder" style="width:160px">'` | `"<td class=\"tdborder\" style=\"width:10rem\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/dailystats.js:117 | `'<td class="tdborder" style="width:160px">'` | `"<td class=\"tdborder\" style=\"width:10rem\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/dailystats.js:155 | `'#f88'` | `reportTheme.color("--app-danger-text")` | --app-danger-text ※統合 |
| lib/report_plugins/dailystats.js:155 | `'#8f8'` | `reportTheme.color("--app-success-text")` | --app-success-text ※統合 |
| lib/report_plugins/dailystats.js:155 | `'#ff8'` | `reportTheme.color("--app-warning-text")` | --app-warning-text ※統合 |
| lib/report_plugins/daytoday.js:165 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:180 | `'WhiteSmoke'` | `"var(--app-surface-sunken)"` | --app-surface-sunken ※統合 |
| lib/report_plugins/daytoday.js:237 | `'#D6FFD6'` | `"var(--app-success-bg)"` | --app-success-bg ※統合 |
| lib/report_plugins/daytoday.js:238 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/daytoday.js:250 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:258 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:270 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/daytoday.js:290 | `return d.color;` | `return reportTheme.readingColor(d.color);` | Resolve paint only; keep gray/raw and transparent classification/filter sentinels |
| lib/report_plugins/daytoday.js:292 | `.style('opacity', function() { return 0.5 })` | `.style('opacity', function() { return 1 })` | Reading markers use opaque semantic ink for non-text contrast; invisible/raw sentinels and density statistics unchanged |
| lib/report_plugins/daytoday.js:294 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:592 | `'blue'` | `"var(--app-primary)"` | --app-primary ※統合 |
| lib/report_plugins/daytoday.js:599 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:636 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:644 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:654 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:662 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:680 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:681 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:682 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:720 | `'10px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:721 | `'normal'` | `"var(--app-font-weight-normal)"` | DDS font weight |
| lib/report_plugins/daytoday.js:722 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:732 | `'10px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:733 | `'normal'` | `"var(--app-font-weight-normal)"` | DDS font weight |
| lib/report_plugins/daytoday.js:734 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:749 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/daytoday.js:764 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:766 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:769 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:770 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:771 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:783 | `'blue'` | `"var(--app-primary)"` | --app-primary ※統合 |
| lib/report_plugins/daytoday.js:785 | `'blue'` | `"var(--app-primary)"` | --app-primary ※統合 |
| lib/report_plugins/daytoday.js:788 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:789 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:790 | `'blue'` | `"var(--app-primary)"` | --app-primary ※統合 |
| lib/report_plugins/daytoday.js:819 | `'white'` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/daytoday.js:820 | `'Violet'` | `"var(--app-chart-exercise)"` | --app-chart-exercise ※統合 |
| lib/report_plugins/daytoday.js:822 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:823 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:824 | `'Violet'` | `"var(--app-chart-exercise)"` | --app-chart-exercise ※統合 |
| lib/report_plugins/daytoday.js:838 | `'white'` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/daytoday.js:839 | `'Salmon'` | `"var(--app-chart-note)"` | --app-chart-note ※統合 |
| lib/report_plugins/daytoday.js:841 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:842 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:843 | `'Salmon'` | `"var(--app-chart-note)"` | --app-chart-note ※統合 |
| lib/report_plugins/daytoday.js:857 | `'white'` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/daytoday.js:858 | `'Brown'` | `"var(--app-warning-text)"` | --app-warning-text ※統合 |
| lib/report_plugins/daytoday.js:860 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:861 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:862 | `'Brown'` | `"var(--app-warning-text)"` | --app-warning-text ※統合 |
| lib/report_plugins/daytoday.js:877 | `'white'` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/daytoday.js:878 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:880 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:881 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:882 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:892 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:895 | `'darkred'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:902 | `'purple'` | `"var(--app-chart-prediction)"` | --app-chart-prediction ※統合 |
| lib/report_plugins/daytoday.js:905 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:908 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:909 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:910 | `'purple'` | `"var(--app-chart-prediction)"` | --app-chart-prediction ※統合 |
| lib/report_plugins/daytoday.js:923 | `'white'` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/daytoday.js:924 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:926 | `'12px'` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:927 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:928 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/daytoday.js:940 | `'blue'` | `"var(--app-primary)"` | --app-primary ※統合 |
| lib/report_plugins/daytoday.js:941 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/daytoday.js:1023 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:1031 | `'red'` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/daytoday.js:1072 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:1106 | `12` | `"var(--app-text-body-sm-size)"` | Annotation font size follows DDS dense small type; coordinates unchanged |
| lib/report_plugins/daytoday.js:1107 | `'bold'` | `"var(--app-font-weight-bold)"` | DDS font weight |
| lib/report_plugins/daytoday.js:1108 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/glucosedistribution.js:86 | `'  width:80px;'` | `"  width:5rem;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/glucosedistribution.js:87 | `'  border: 1px #ccc solid;'` | `"  border: 1px var(--app-border) solid;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/glucosedistribution.js:89 | `'  padding: 1px;'` | `"  padding: 0.0625rem;"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/glucosedistribution.js:103 | `'#f88'` | `reportTheme.color("--app-danger-text")` | --app-danger-text ※統合 |
| lib/report_plugins/glucosedistribution.js:103 | `'#8f8'` | `reportTheme.color("--app-success-text")` | --app-success-text ※統合 |
| lib/report_plugins/glucosedistribution.js:103 | `'#ff8'` | `reportTheme.color("--app-warning-text")` | --app-warning-text ※統合 |
| lib/report_plugins/glucosedistribution.js:105 | `'#f88'` | `"var(--app-danger-bg)"` | --app-danger-bg ※統合 |
| lib/report_plugins/glucosedistribution.js:106 | `'#8f8'` | `"var(--app-success-bg)"` | --app-success-bg ※統合 |
| lib/report_plugins/glucosedistribution.js:107 | `'#ff8'` | `"var(--app-warning-bg)"` | --app-warning-bg ※統合 |
| lib/report_plugins/hourlystats.js:191 | `"black"` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/hourlystats.js:191 | `"red"` | `"var(--app-danger-text)"` | --app-danger-text ※統合 |
| lib/report_plugins/hourlystats.js:191 | `"lightgreen"` | `"var(--app-success-text)"` | --app-success-text ※統合 |
| lib/report_plugins/hourlystats.js:193 | `'<span style="color:black;">'` | `"<span style=\"color:var(--app-text);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:194 | `'<span style="color:black;">'` | `"<span style=\"color:var(--app-text);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:195 | `';font-weight:bold;">'` | `";font-weight:var(--app-font-weight-bold);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:203 | `'<span style="font-weight:bold;">'` | `"<span style=\"font-weight:var(--app-font-weight-bold);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:205 | `"white"` | `"var(--app-surface)"` | --app-surface ※統合 |
| lib/report_plugins/hourlystats.js:205 | `"red"` | `"var(--app-danger-bg)"` | --app-danger-bg ※統合 |
| lib/report_plugins/hourlystats.js:205 | `"lightgreen"` | `"var(--app-success-bg)"` | --app-success-bg ※統合 |
| lib/report_plugins/hourlystats.js:207 | `'<span style="color:black;">'` | `"<span style=\"color:var(--app-text);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:208 | `'<span style="color:black;">'` | `"<span style=\"color:var(--app-text);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/hourlystats.js:209 | `'<span style="color:black;font-weight:bold;">'` | `"<span style=\"color:var(--app-text);font-weight:var(--app-font-weight-bold);\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:69 | `'  <div class="chart" id="loopalyzer-basal" style="height:100px;margin-bottom:-14px;"></div>'` | `"  <div class=\"chart\" id=\"loopalyzer-basal\" style=\"height:6.25rem;margin-bottom:-0.875rem;\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:70 | `'  <div class="chart" id="loopalyzer-bg" style="height:200px;margin-bottom:-14px;"></div>'` | `"  <div class=\"chart\" id=\"loopalyzer-bg\" style=\"height:12.5rem;margin-bottom:-0.875rem;\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:71 | `'  <div class="chart" id="loopalyzer-tempbasal" style="height:150px;margin-bottom:-14px;"></div>'` | `"  <div class=\"chart\" id=\"loopalyzer-tempbasal\" style=\"height:9.375rem;margin-bottom:-0.875rem;\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:72 | `'  <div class="chart" id="loopalyzer-iob" style="height:150px;margin-bottom:-14px;"></div>'` | `"  <div class=\"chart\" id=\"loopalyzer-iob\" style=\"height:9.375rem;margin-bottom:-0.875rem;\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:73 | `'  <div class="chart" id="loopalyzer-cob" style="height:150px;"></div>'` | `"  <div class=\"chart\" id=\"loopalyzer-cob\" style=\"height:9.375rem;\"></div>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:81 | `'#loopalyzer-charts, #loopalyzer-profiles { padding: 20px; } '` | `"#loopalyzer-charts, #loopalyzer-profiles { padding: 1.25rem; } "` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:86 | `'#loopalyzer-profiles-table table { margin: 0 10px; border-collapse: collapse; border: 0px; }'` | `"#loopalyzer-profiles-table table { margin: 0 0.625rem; border-collapse: collapse; border: 0px; }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:88 | `'#loopalyzer-profiles-table td table { margin: 0 10px; border-collapse: collapse; border: 0px; }'` | `"#loopalyzer-profiles-table td table { margin: 0 0.625rem; border-collapse: collapse; border: 0px; }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:89 | `'#loopalyzer-profiles-table td caption { text-align: left; font-weight: bold; }'` | `"#loopalyzer-profiles-table td caption { text-align: left; font-weight:var(--app-font-weight-bold); }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:90 | `'#loopalyzer-profiles-table td th { background-color: #4CAF50; color: white; }'` | `"#loopalyzer-profiles-table td th { background-color: var(--app-surface-sunken); color: var(--app-text); }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:91 | `'#loopalyzer-profiles-table td td { text-align: right; vertical-align: top; padding: 0 1px; }'` | `"#loopalyzer-profiles-table td td { text-align: right; vertical-align: top; padding: 0 0.0625rem; }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:92 | `'#loopalyzer-profiles-table td td td { padding: 1px 8px; }'` | `"#loopalyzer-profiles-table td td td { padding: 0.0625rem 0.5rem; }"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/loopalyzer.js:922 | `'gray'` | `reportTheme.color("--app-text-muted")` | --app-text-muted ※統合 |
| lib/report_plugins/loopalyzer.js:929 | `'black'` | `reportTheme.color("--app-text")` | --app-text ※統合 |
| lib/report_plugins/loopalyzer.js:1070 | `'#DDDDDD'` | `reportTheme.color("--app-border")` | --app-border ※統合 |
| lib/report_plugins/loopalyzer.js:1071 | `'#33A0FF'` | `reportTheme.color("--app-info-text")` | --app-info-text ※統合 |
| lib/report_plugins/loopalyzer.js:1072 | `'#33AA33'` | `reportTheme.color("--app-success-text")` | --app-success-text ※統合 |
| lib/report_plugins/loopalyzer.js:1073 | `'#8E1578'` | `reportTheme.color("--app-chart-prediction")` | --app-chart-prediction ※統合 |
| lib/report_plugins/loopalyzer.js:1074 | `'#D6FFD6'` | `reportTheme.color("--app-success-bg")` | --app-success-bg ※統合 |
| lib/report_plugins/loopalyzer.js:1075 | `'#FF7000'` | `reportTheme.color("--app-chart-note")` | --app-chart-note ※統合 |
| lib/report_plugins/loopalyzer.js:1076 | `'#23D820'` | `reportTheme.color("--app-success-text")` | --app-success-text ※統合 |
| lib/report_plugins/loopalyzer.js:1077 | `"#F3F3F3"` | `reportTheme.color("--app-surface-sunken")` | --app-surface-sunken ※統合 |
| lib/report_plugins/loopalyzer.js:1094 | `"#FFFFFF"` | `reportTheme.color("--app-surface")` | --app-surface ※統合 |
| lib/report_plugins/loopalyzer.js:1100 | `"#000000"` | `reportTheme.color("--app-text")` | --app-text ※統合 |
| lib/report_plugins/percentile.js:24 | `'<div style="height:500px;">'` | `"<div style=\"height:31.25rem;\">"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/percentile.js:101 | `'#000000'` | `reportTheme.color("--app-text")` | --app-text ※統合 |
| lib/report_plugins/percentile.js:113 | `'#000055'` | `reportTheme.color("--app-info-text")` | --app-info-text ※統合 |
| lib/report_plugins/percentile.js:125 | `'#000055'` | `reportTheme.color("--app-info-text")` | --app-info-text ※統合 |
| lib/report_plugins/percentile.js:138 | `'#a0a0FF'` | `reportTheme.color("--app-chart-percentile-outer")` | --app-chart-percentile-outer ※統合 |
| lib/report_plugins/percentile.js:150 | `'#a0a0FF'` | `reportTheme.color("--app-chart-percentile-outer")` | --app-chart-percentile-outer ※統合 |
| lib/report_plugins/percentile.js:162 | `'#FFFF00'` | `reportTheme.color("--app-warning-text")` | --app-warning-text ※統合 |
| lib/report_plugins/percentile.js:166 | `'#FF0000'` | `reportTheme.color("--app-danger-text")` | --app-danger-text ※統合 |
| lib/report_plugins/percentile.js:172 | `'#555'` | `reportTheme.color("--app-border-strong")` | --app-border-strong ※統合 |
| lib/report_plugins/percentile.js:177 | `'#555'` | `reportTheme.color("--app-border-strong")` | --app-border-strong ※統合 |
| lib/report_plugins/percentile.js:181 | `'#FF0000'` | `reportTheme.color("--app-danger-text")` | --app-danger-text ※統合 |
| lib/report_plugins/percentile.js:188 | `'#FFFF00'` | `reportTheme.color("--app-warning-text")` | --app-warning-text ※統合 |
| lib/report_plugins/success.js:26 | `#success-placeholder td {   	border: 1px #ccc solid;   	margin: 0;   	padding: 1px;    text-align:center;   }   #success-placeholder .bad {   	background-color: #fcc;   }   #succes` | `#success-placeholder td {   	border: 1px var(--app-border) solid;   	margin: 0;   	padding: 0.0625rem;    text-align:center;   }   #success-placeholder .bad {   	background-color: ` | Reviewed CSS template color/type/geometry declarations |
| lib/report_plugins/treatments.js:36 | `'" class="icon-chart-line" style="margin-right:0;margin-left:-0.6em;color:lightgreen"></i>'` | `"\" class=\"icon-chart-line\" style=\"margin-right:0;margin-left:-0.6em;color:var(--app-success-text)\"></i>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/treatments.js:38 | `'" class="icon-tint" style="margin-right:0;margin-left:-0.6em;color:red"></i>'` | `"\" class=\"icon-tint\" style=\"margin-right:0;margin-left:-0.6em;color:var(--app-danger-text)\"></i>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/treatments.js:40 | `'" class="icon-sort-numeric" style="margin-right:0;margin-left:-0.6em;color:blue"></i>'` | `"\" class=\"icon-sort-numeric\" style=\"margin-right:0;margin-left:-0.6em;color:var(--app-primary)\"></i>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/treatments.js:83 | `'      <textarea id="rped_adnotes" style="width:300px"></textarea><br>'` | `"      <textarea id=\"rped_adnotes\" style=\"width:18.75rem\"></textarea><br>"` | Reviewed embedded color/type/geometry declarations |
| lib/report_plugins/treatments.js:292 | `'gray'` | `"var(--app-text-muted)"` | --app-text-muted ※統合 |
| lib/report_plugins/treatments.js:311 | `'lightgray'` | `"var(--app-surface-sunken)"` | --app-surface-sunken ※統合 |
| lib/report_plugins/weektoweek.js:7 | `'rgb(73, 22, 153)'` | `"var(--app-chart-day-1)"` | --app-chart-day-1 ※統合 |
| lib/report_plugins/weektoweek.js:8 | `'rgb(34, 201, 228)'` | `"var(--app-chart-day-2)"` | --app-chart-day-2 ※統合 |
| lib/report_plugins/weektoweek.js:9 | `'rgb(0, 153, 123)'` | `"var(--app-chart-day-3)"` | --app-chart-day-3 ※統合 |
| lib/report_plugins/weektoweek.js:10 | `'rgb(135, 135, 228)'` | `"var(--app-chart-day-4)"` | --app-chart-day-4 ※統合 |
| lib/report_plugins/weektoweek.js:11 | `'rgb(135, 49, 204)'` | `"var(--app-chart-day-5)"` | --app-chart-day-5 ※統合 |
| lib/report_plugins/weektoweek.js:12 | `'rgb(36, 36, 228)'` | `"var(--app-chart-day-6)"` | --app-chart-day-6 ※統合 |
| lib/report_plugins/weektoweek.js:13 | `'rgb(0, 234, 188)'` | `"var(--app-chart-day-7)"` | --app-chart-day-7 ※統合 |
| lib/report_plugins/weektoweek.js:172 | `'#0099ff'` | `"var(--app-info-text)"` | --app-info-text ※統合 |
| lib/report_plugins/weektoweek.js:189 | `'WhiteSmoke'` | `"var(--app-surface-sunken)"` | --app-surface-sunken ※統合 |
| lib/report_plugins/weektoweek.js:234 | `'#D6FFD6'` | `"var(--app-success-bg)"` | --app-success-bg ※統合 |
| lib/report_plugins/weektoweek.js:235 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/weektoweek.js:247 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/weektoweek.js:255 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |
| lib/report_plugins/weektoweek.js:267 | `'grey'` | `"var(--app-border-strong)"` | --app-border-strong ※統合 |
| lib/report_plugins/weektoweek.js:291 | `return d.color;` | `return reportTheme.readingColor(d.color);` | Resolve paint only; keep gray/raw and transparent classification/filter sentinels |
| lib/report_plugins/weektoweek.js:293 | `.style('opacity', function() { return 0.5 })` | `.style('opacity', function() { return 1 })` | Weekday reading markers use opaque ink; keep date/weekday grouping and raw masking |
| lib/report_plugins/weektoweek.js:295 | `'black'` | `"var(--app-text)"` | --app-text ※統合 |

## 予測表示と警報停止のPopover（2026-10-13追加選定）

DDS Popover/DropdownMenu（設計書4.1-9）の原本4ファイルをvendor/popoverへ保存し、既存jQueryの開閉・選択・ack処理を保ったHTMLアダプターを使用する。トリガーはnative button、警報停止はmenuitem、予測表示は既存checkboxをmenuitemcheckboxとして扱う。aria-expanded、Escape/外側クリック、矢印/Home/End、選択時のfocus returnを追加。予測の再描画で入力が再生成される際は同じforecast-typeへfocusを戻す。閾値・停止時間・送信先・権限・計算・入力値は変更しない。

CSSはDDS Popover原本を使い、既存DOMとの詳細度/幅調整だけをLayer 3で追加。巨大なdisplay書体はbodyへ変更し、44px以上のヒット領域、フォーカスリング、境界/面/意味色・余白はsemantic tokenを使用。表示位置の上限はviewportに応じる構造値remとvw。警報がないときは操作不可をaria-disabledと見た目で示し、警報停止後もfocusの帰着先を維持する。


## レポートの追加差分（2026-10-13）

治療表の連結CSS断片を再抽出。border-bottom:1pt solid #eee → 1px solid var(--app-border)。追加計画design-report-addon-plan.jsonを保存してから反映する。空の表見出しには、日別「血糖範囲の分布」、時間帯「日付」、治療「操作」を表示し、数値セルは変更しない。凡例の補助caption除去とこの3見出しだけを比較の明示的な表示差分として扱う。

## クライアントの残存タイポグラフィ（2026-10-13追加選定）

再抽出でchart.jsの軸4個の16px、renderer.jsの固定サイズ15（style 3個、SVG attr 3個）、boluscalc.jsの食品表12pxが残っていた。いずれも既存の本文対応と同じ --app-text-body-size へ統合する。食品表の20px余白は1.25remへ換算する。rendererの治療ラベルは既存の値・件数・scaleによる計算を維持し、描画境界のreturnのみ calc(var(--app-text-body-size) * (元の計算値 / 16)) の文字列とする。16は既存のpx座標系を本文トークン倍率へ換算する基準であり、臨床計算に使わない。旧黒色のtext-shadowは白い面に黒文字を描く現行テーマで不要なためnoneへ変更する。全13宣言をdesign-client-type-plan.jsonへ保存した後、一つのモジュールずつ反映し、逆変換した全ソース・AST一致、計算回帰、実描画を確認する。文字サイズ・影以外の座標・値・イベント・権限・通信内容は変更しない。

## 受信予測データの描画境界（2026-10-13追加選定）

AR2のcyan、Loop/OpenAPS Valuesの#ff00ff、OpenAPS既定IOB #1e88e5、COB/Accel-COB #FB8C00、Zero-Temp #00d2d2、UAM #c9bd60はサーバー側モデル/配信データの値として維持する。rendererのSVG strokeだけを新しいLayer 2 --app-chart-forecast-*へ解決する。ar2→cyan-1000、value→magenta-1000、iob→blue-900、cob→orange-1000、acob→purple-1000、zt→green-1000、uam→yellow-1000を選定。色以外のseries/type/info/値/時刻/座標/予測と通知の計算は維持。未知または利用者設定の別色、読み取り以外の透明sentinelはそのまま返す。

既定予測の過度なfadeで描画が低コントラストになるため、正のopacityだけ下限0.7を設け、面上の合成色で3:1を検証する。noFade/null/過去値/透明/0以下/不正opacityと利用者の別色は変更しない。未検証の色に下限を強制しない。元のfutureOpacity計算は呼び出してその結果を表示境界で調整する。判別を色だけに頼らず、既存の中空マーカー・予測選択名・type/infoを維持する。上限やフィルター、下限外の不可視値を復活させない。計画SHA/ASTを保存した後に適用し、元データ不変、完全な描画座標比較、既存計算と操作を再確認する。


### 管理画面 futureitems の残存表示値

ユーザーから委任されたトークン選定に基づき、下記の同等な表面・状態色とrem換算を適用する。期間境界、件数、削除条件、権限、通信には変更を加えない。

| 元の値 | 適用する表示値 |
| --- | --- |
| `.css('background-color', '#0f0f0f')` | `.css('background-color', 'var(--app-surface)')` |
| `.css('background', '#040404')` | `.css('background', 'var(--app-surface-sunken)')` |
| `.css('width', '80px')` | `.css('width', '5rem')` |
| `.css('width', '150px')` | `.css('width', '9.375rem')` |
| `.css('width', '50px')` | `.css('width', '3.125rem')` |
| `.css('width', '300px')` | `.css('width', '18.75rem')` |
| `.css('margin-top', '10px')` | `.css('margin-top', '0.625rem')` |


### 管理画面 daterangedelete の残存表示値

ユーザーから委任されたトークン選定に基づき、下記の同等な表面・状態色とrem換算を適用する。期間境界、件数、削除条件、権限、通信には変更を加えない。

| 元の値 | 適用する表示値 |
| --- | --- |
| `margin-top: 10px` | `margin-top: 0.625rem` |
| `margin-right: 10px` | `margin-right: 0.625rem` |
| `margin-left: 10px` | `margin-left: 0.625rem` |
| `margin-top: 5px` | `margin-top: 0.3125rem` |
| `color: #666` | `color: var(--app-text-muted)` |
| `color: '#666'` | `color: 'var(--app-text-muted)'` |
| `color: 'red'` | `color: 'var(--app-danger-text)'` |
| `color: 'orange'` | `color: 'var(--app-warning-text)'` |
| `color: 'gray'` | `color: 'var(--app-text-muted)'` |
| `color: 'green'` | `color: 'var(--app-success-text)'` |
