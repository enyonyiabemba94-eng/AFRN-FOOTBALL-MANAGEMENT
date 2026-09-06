(()=>{'use strict';
/* Line-up protection is now enforced directly in matches.html: only lineup_* rows are deleted.
   This bridge intentionally does not copy/restore real match events, avoiding duplicate goals/cards. */
if(!location.pathname.endsWith('matches.html')||window.__AFRN_LINEUP_PROTECTION__)return;
window.__AFRN_LINEUP_PROTECTION__=true;
})();