import "dotenv/config";
import cron from "node-cron";
import { fetchAndStoreTariffs } from "#services/wbTariffsService.js";
import { updateAllSheets } from "#services/googleSheetsService.js";
import knex from "#postgres/knex.js";

async function main() {
    await knex.migrate.latest();
    await knex.seed.run();

    try {
        await fetchAndStoreTariffs();
    }
    catch (err) {
        console.error("WB cron error:", err);
    }
    try {
        await updateAllSheets();
    }
    catch (err) {
        console.error("Sheets cron error:", err);
    }

    cron.schedule("0 * * * *", async () => {
        try {
            await fetchAndStoreTariffs();
        }
        catch (err) {
            console.error("WB cron error:", err);
        }
    });

    cron.schedule("0 * * * *", async () => {
        try {
            await updateAllSheets();
        }
        catch (err) {
            console.error("Sheets cron error:", err);
        }
    });

    console.log("Service started: WB tariffs every hour, Sheets update every hour.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});