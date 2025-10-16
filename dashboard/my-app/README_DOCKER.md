# Dashboard + MariaDB + phpMyAdmin (Docker)

**Ports:**
- Dashboard (Nginx): `http://localhost:8081`
- phpMyAdmin: `http://localhost:8082`
- MariaDB (optional external access): `localhost:3307`

## Quick Start

```bash
cd Programmierprojekte/dashboard/my-app

# 1) Create/adjust DB credentials
cp -n .env.mariadb .env.mariadb

# 2) Build & run
docker compose up -d --build

# 3) Open the apps
# Dashboard:  http://localhost:8081
# phpMyAdmin: http://localhost:8082
```

> ⚠️ The dashboard is served from the prebuilt `./dist` folder.
> If you want to develop the frontend, run your Vite dev server locally,
> or rebuild `dist` and re-run `docker compose up -d --build`.

## API Endpoints

- Health check: `GET http://localhost:8081/api/` (proxied to PHP)
- Register: `POST http://localhost:8081/api/register.php`
- Login: `POST http://localhost:8081/api/login.php`

**Request Body (JSON):**
```json
{ "name": "Max", "massnahme": "M1", "rolle": "Teilnehmer", "password": "geheim123" }
```

## Database

- The initial schema from `./db/init/sql/001_schema.sql` is auto-applied on first run.
- Credentials come from `.env.mariadb` and are injected into the API container as:
  - `DB_HOST=db`
  - `DB_NAME=${MARIADB_DATABASE}`
  - `DB_USER=${MARIADB_USER}`
  - `DB_PASS=${MARIADB_PASSWORD}`

## Tips

- If port `3307` conflicts, change it in `docker-compose.yml` (left side of `3307:3306`).
- If you already have a local MySQL, you can remove the port mapping entirely.
- For CORS in production, set a specific origin in `db/init/api/bootstrap.php`.
- If you change `.env.mariadb`, recreate containers: `docker compose up -d --force-recreate`.
