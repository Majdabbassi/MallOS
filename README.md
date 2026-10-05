# Mall OS

A multi-tenant platform for running shopping malls. A platform administrator creates malls and assigns each one a manager; the manager uploads the **floor plan**, traces the shop units on it, links every unit to a store (tenant, rent, contract, status) and invites assistants with fine-grained permissions. Every mall is isolated from every other.

**Spring Boot 3 · Java 21 · MySQL · JWT · Angular 18 · PrimeNG · Docker**

| Interactive floor plan | Stores and occupancy |
| --- | --- |
| ![Floor plan](docs/screenshots/floor-plan.png) | ![Stores](docs/screenshots/stores.png) |

| Manager dashboard | Team and permissions |
| --- | --- |
| ![Dashboard](docs/screenshots/manager-dashboard.png) | ![Team](docs/screenshots/team.png) |

| Admin: malls and their managers | Sign in |
| --- | --- |
| ![Admin](docs/screenshots/admin-team.png) | ![Login](docs/screenshots/login.png) |

## What it does

- **Floor plans**: upload an image of a floor (PNG, JPEG, WebP, GIF; the real file content is checked, not just the extension), trace polygons for units, corridors and common areas, and link each unit polygon to a store.
- **Stores**: code, category, zone, surface, status (open, closed, under renovation, vacant), owner, contract dates and monthly rent, with occupancy statistics.
- **Roles and permissions**: a *super admin* runs the platform; a *manager* has full access to one mall; *assistants* get only the permissions the manager grants (manage stores, edit the floor plan, view reports, finance, ...).
- **Isolation**: a user can only reach the malls they belong to, and ids from another mall are never honored, even when put in the right URL.

## Run it

Needs Docker with Compose.

```bash
cp .env.example .env     # then set DB_PASSWORD and ADMIN_PASSWORD
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web app | http://localhost |
| API | http://localhost:8080 (Swagger UI at `/swagger-ui.html`) |

On an empty database the first start creates a demo mall with a traced floor plan, 7 stores, a manager and an assistant.

| Role | Username | Password |
| --- | --- | --- |
| Super admin | `admin` | the `ADMIN_PASSWORD` you set in `.env` |
| Manager of the demo mall | `manager` | `Manager@123` |
| Assistant (stores and reports only) | `assistant` | `Manager@123` |

Try this: sign in as `manager`, open **Interactive Map**, then sign in as `assistant` and notice that adding a store works but editing the floor plan and the Team page are refused.

## Security

The authorization model was already solid, so the audit (by running the app and attacking it with outsiders, assistants and managers of other malls) focused on what was around it. Findings, all fixed:

- `docker compose up` could not even start: an invalid default in the compose file (`${JWT_SECRET:default}`).
- Every mall call from the web app returned a 500: the UI used `/api/malls` while the API served `/malls`.
- Client mistakes (a non-numeric id, JSON sent to a file-upload endpoint, an unknown path) answered **500**; they are now 400, 415 and 404.
- The published development JWT key now makes the API refuse to start under the `prod` profile.
- Features that were half-built: the backend could manage assistants and managers but the web app had no screen for it. There is now a **Team** page for managers and a **Team** dialog for admins. Decorative controls that did nothing (a fake notification badge, a search button, hard-coded "+2 this month" trends) were removed instead of left in place.
- The demo floor plan lives in the jar and is restored on start, so a host with an ephemeral disk does not lose it.

What was already good, and is covered by the tests: deny-by-default, roles re-read from the database on every request (so deactivating someone takes effect immediately), self-registration can only ever create a plain user, cross-mall access answers 403 and cross-mall ids in the wrong URL answer 404, uploaded images are only served to authenticated members, and no response ever contains a password hash.

## Tests

```bash
cd backend && mvn test
```

30 tests on an in-memory database (no services needed): the whole authorization matrix (outsiders, assistants with and without each permission, managers of other malls, ids smuggled into the wrong mall), upload validation, the team screen, tidy error answers and the JWT key guard. CI also builds the web app and validates the compose file.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | database (compose fills these in) |
| `JWT_SECRET` | token signing key, at least 32 characters; the dev default is refused under the `prod` profile |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the super admin created on an empty database |
| `DEMO_ENABLED`, `DEMO_MANAGER_*` | seed the demo mall (on by default) |
| `SPRING_PROFILES_ACTIVE` | `prod` enables the key guard |

## Deploying (free tiers, works with a private repository)

| Part | Where | How |
| --- | --- | --- |
| Database | TiDB Cloud Serverless | create a database named `mallos` |
| API | Render (Docker) | New, Blueprint, pick this repo: `render.yaml` does the rest; set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ADMIN_PASSWORD` |
| Web app | Vercel | import the repo, Root Directory `frontend`; `frontend/vercel.json` forwards `/api` and `/auth` to the API, so the browser only ever talks to one origin |

The free API sleeps when idle: the first request after a pause can take about a minute.

## Project layout

```
backend/    Spring Boot API: mall (floors, polygons, stores, members, permissions), auth (JWT), config
frontend/   Angular 18 app: admin console and manager workspace (floor map viewer, trace editor, stores, team)
docs/       screenshots
```
