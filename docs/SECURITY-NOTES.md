# Security notes

Standing decisions on reported vulnerabilities, with the reasoning, so nobody
has to re-derive it and nobody runs `npm audit fix --force` on reflex.

---

## postcss, high severity, NOT ACTED ON

**Assessed** 14 September 2026
**Advisories** GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849
**Reaches us through** `next` 15.5.25, which depends on `postcss` at or below 8.5.22
**Proposed fix** `npm audit fix --force`, which installs `next@16.3.5`

### What the advisories actually describe

Two shapes of attack, both requiring the attacker to control CSS that postcss
then processes.

1. XSS through an unescaped `</style>` surviving into stringify output.
2. Arbitrary `.map` file disclosure through an attacker-controlled
   `sourceMappingURL` comment, including a path traversal variant.

### Why it does not apply here

postcss runs at **build time only**, and the only CSS it ever sees is
`web/app/globals.css`, which is committed to this repository and written by us.

There is no code path in this application where a third party supplies CSS.
Growth Desk has one user, accepts no uploads, renders no user-authored styles,
and has no CSS-in-the-database feature. Draft text is escaped as text and never
interpolated into a stylesheet.

So the precondition every one of these advisories needs does not exist.

### Why the fix is worse than the finding

`npm audit fix --force` moves Next from 15 to 16, a breaking major version, to
patch a build-time dependency that cannot be triggered. That trades a
theoretical issue for a real one, since a major upgrade means re-verifying
every route, the middleware, and the Auth.js integration.

`npm audit` has no way to know postcss only ever sees our own file. It reports
the dependency, not the exposure. Reading the advisory is the difference.

### What would change this decision

- The app starts processing CSS from anywhere other than this repository.
- Next ships a patched postcss inside the 15.x line, which makes the upgrade
  free. Worth checking on any routine dependency bump.
- A new advisory lands that is exploitable at runtime rather than at build time.

Until one of those happens, the finding stays open and unactioned on purpose.

---

## How CI treats audit findings

The `npm audit` step is informational and does not fail the build. A
permanently red build teaches people to ignore red builds, and this repository
already has one finding that is correctly ignored.

Anything genuinely critical should be read and decided on, then recorded here.
