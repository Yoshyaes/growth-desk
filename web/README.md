# growth desk, hosted

The Next.js app. The repository is still the database.

## What is different from the local server

| | Local (`../server`) | Hosted (this) |
|---|---|---|
| Storage | read and write the working tree | config from the deployment bundle, state through the GitHub API |
| Auth | none, binds to 127.0.0.1 | GitHub, allowlist of one |
| Can it edit the ethics gate | yes, it is a file on your disk | **no.** the gate ships immutable and needs a pull request |
| Phone | no | yes, and it is the reason this exists |

Both read the same files. Both run the same gate. `docs/ARCHITECTURE-HOSTED.md`
has the reasoning.

## Run it

```bash
cp .env.example .env.local     # fill in the values
npm install
npm run dev                    # http://localhost:4780
```

Leave `GD_STORE` unset to run against the local working tree instead of the
GitHub API, which is the faster loop while building.

## Deploy

1. Push this repo to GitHub.
2. Import it on Vercel with the root directory set to `web`.
3. Create a GitHub OAuth app. Callback is
   `https://<deployment>/api/auth/callback/github`.
4. Create a fine grained personal access token. Contents read and write.
   **This repository only.**
5. Set every variable from `.env.example` in the Vercel project.

`GD_ALLOWED_LOGIN` fails closed. If it is empty, nobody can sign in, including you.

## Test the core

The gate, the voice lint, the YAML reader and the store have 64 tests and they
do not need this app or a build step.

```bash
cd .. && node --test 'tests/*.test.js'
```

That is deliberate. The part that must be provably correct is plain JavaScript
with no toolchain between it and the assertion.
