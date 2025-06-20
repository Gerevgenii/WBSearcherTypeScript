# WB Tariffs Service

**Сервис получения тарифов Wildberries и регулярного обновления Google Sheets**

Проект включает:

1. Автоматическое **ежечасное** получение тарифов Wildberries по API (`https://common-api.wildberries.ru/api/v1/tariffs/box`) и сохранение их в PostgreSQL.
2. **По расписанию** (cron) обновление указанных GoogleSheets (лист `stocks_coefs`) данными из БД.

Запуск всех компонентов осуществляется в Docker-контейнерах одной командой.

---

## Содержание репозитория

* **docker-compose.yml** – конфигурация сервисов `postgres` и `app`.
* **Dockerfile** – сборка Node.js-приложения.
* **.env.example** – пример файла окружения без секретов.
* **wb\_api\_token** – секретный файл с токеном WB API (игнорируется Git).
* **credentials.json** – секретный файл с JSON-ключом GCP (игнорируется Git).
* **src/** – исходники на TypeScript:

    * `app.ts` – точка входа, настройка cron.
    * **services/** – бизнес-логика:

        * `wbTariffsService.ts` – fetch и сохранение тарифов.
        * `googleSheetsService.ts` – экспорт в GoogleSheets.
    * **postgres/migrations/** – миграции Knex.
    * **postgres/seeds/** – сиды Knex.
* **dist/** – скомпилированный JavaScript (генерируется при сборке).

---

## Требования

* Docker ≥20.10
* Docker Compose ≥1.29

---

## Настройка окружения

1. Склонируйте репозиторий и перейдите в папку:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Скопируйте пример файла окружения и отредактируйте:

   ```bash
   cp .env.example .env
   ```
3. В `.env` укажите конфигурацию (без токенов):

   ```ini
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   POSTGRES_DB=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   APP_PORT=5000
   
   SHEET_IDS=1YsAS6bVQqOzVEMq3ebCTcSH0YwtqWyTKM3k3VOw5Fcc
   ```
4. Добавьте в `.gitignore` все секреты:

   ```
   .env
   wb\_api\_token
   ```
5. Создайте рядом с `docker-compose.yml` файл:
   - **wb_api_token** – единственная строка с вашим JWT.
   - **credentials.json** – JSON-ключ сервисного аккаунта GCP.

       **Как получить `credentials.json`:**
       1. Зайдите в Google Cloud Console: https://console.cloud.google.com/
       2. Выберите или создайте проект.
       3. В меню слева перейдите в **IAM & Admin → Service Accounts**.
       4. Нажмите **Создать сервисный аккаунт**, задайте имя, роль **Project → Editor** или **Sheets API Editor**.
       5. После создания кликните на аккаунт и выберите **Keys → Add Key → Create New Key**.
       6. Выберите формат **JSON** и скачайте файл – это ваш `credentials.json`.
       7. Поместите этот файл рядом с `docker-compose.yml`.
       8. - После этого отправьте email мне, чтобы я добавил вас в **editors** таблицы
          - Или же создайте собственную таблицу, где также будет необходимо добавить адрес в editors 
---

## Запуск

Выполните:

```bash
docker compose up --build
```
1. **postgres** запустит БД.
2. **app**:

    * Применит миграции: `knex migrate:latest`.
    * Запустит cron:

        * Получение тарифов каждый час.
        * Обновление GoogleSheets каждый час.

---

## Проверка работы

### Логи приложения

```bash
docker compose logs -f app
```

Ожидаемые записи:

```
   [WB] Parsed 35 tariffs for 2025-06-20
   [WB] tariffs stored for 2025-06-20, count=35
   [Sheets] 1YsAS6bVQqOzVEMq3ebCTcSH0YwtqWyTKM3k3VOw5Fcc updated with 35 rows.
   Service started: WB tariffs every hour, Sheets update every hour.
```

### Данные в PostgreSQL

```bash
docker exec -it postgres1 psql -U postgres -d postgres
SELECT COUNT(*) FROM daily_tariffs WHERE day = CURRENT_DATE;
\q
```

### Данные в GoogleSheets

Откройте таблицы по ID из `SHEET_IDS`, лист `stocks_coefs` ([Table](https://docs.google.com/spreadsheets/d/1YsAS6bVQqOzVEMq3ebCTcSH0YwtqWyTKM3k3VOw5Fcc/edit?gid=0#gid=0)):

* Проверить сортировку по возрастанию коэффициента.
* Запуск cron можно протестировать вручную:

  ```bash
  docker exec -it wb-tariffs-app sh
  npm run fetch:tariffs
  npm run update:sheets
  ```

---

## Дополнительные команды

* Ручной запуск миграций:

  ```bash
  docker exec -it wb-tariffs-app sh -c "npx knex migrate:latest --knexfile dist/config/knex/knexfile.js --cwd ."
  ```
* Ручной запуск сидов:

  ```bash
  docker exec -it wb-tariffs-app sh -c "npx knex seed:run --knexfile dist/config/knex/knexfile.js --cwd ."
  ```

---