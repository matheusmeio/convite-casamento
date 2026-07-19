# Debug Session: page-flip-bleed

- Status: OPEN
- Date: 2026-07-17
- Symptoms:
  - During page flip, content from the next page appears behind the current page.
  - The monogram letters still look visually wrong after deploy.
- Scope:
  - Frontend runtime rendering in the flipbook experience.
- Initial hypotheses:
  - H1: The page-flip library is exposing the back face of page layers because the rendered page nodes are missing effective backface isolation.
  - H2: The visible bleed is not from CSS background color, but from the DOM/content layer being rendered on both sides during transform.
  - H3: The monogram still looks wrong because the updated CSS is not the one actually applied in production.
  - H4: The monogram layout is still optically off because overlapping initials need different markup, not just CSS offsets.
  - H5: The production deploy may be loading the new code, but page-flip wrapper nodes apply transforms that defeat the current page-level CSS fix.

- Evidence summary:
  - Local runtime logs show `pageBg=rgb(255,255,255)` and `pageBackface=hidden` on initial render and on flip.
  - `wrapperCount` and `itemCount` show extra `page-flip` wrapper nodes beyond the invitation page itself.
  - Monogram geometry confirms the two initials still use unequal bounds and overlap asymmetrically.

- Hypothesis status:
  - H1: INCONCLUSIVE
  - H2: CONFIRMED (most likely)
  - H3: INCONCLUSIVE
  - H4: CONFIRMED
  - H5: INCONCLUSIVE
