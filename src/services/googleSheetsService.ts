import { google } from "googleapis";
import knex from "../postgres/knex.js";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";

const SHEET_NAME = "stocks_coefs";
const RANGE = `${SHEET_NAME}!A1:F`;

async function getAuthClient(): Promise<JWT> {
    const credentials = JSON.parse(readFileSync("/run/secrets/google-credentials.json", "utf-8"));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return auth.getClient() as Promise<JWT>;
}

export async function updateAllSheets(): Promise<void> {
    const authClient = await getAuthClient();
    const sheetsAPI = google.sheets({ version: "v4", auth: authClient });

    const rows = await knex("spreadsheets").select("spreadsheet_id");
    const sheetIds = rows.map((r: any) => r.spreadsheet_id).filter((value) => value !== "some_spreadsheet");

    const today = new Date().toISOString().slice(0, 10);
    const tariffs = await knex("daily_tariffs")
        .where({ day: today })
        .select(
            "warehouse",
            "delivery_base",
            "delivery_liter",
            "delivery_and_storage",
            "storage_base",
            "storage_liter",
        )
        .orderBy("delivery_and_storage", "asc");

    const values = [
        [
            "Warehouse",
            "Delivery Base",
            "Delivery Liter",
            "Delivery & Storage",
            "Storage Base",
            "Storage Liter",
        ],
        ...tariffs.map((t) => [
            t.warehouse,
            t.delivery_base,
            t.delivery_liter,
            t.delivery_and_storage,
            t.storage_base,
            t.storage_liter,
        ]),
    ];

    for (const id of sheetIds) {
        await sheetsAPI.spreadsheets.values.clear({
            spreadsheetId: id,
            range: RANGE,
        });
        await sheetsAPI.spreadsheets.values.update({
            spreadsheetId: id,
            range: RANGE,
            valueInputOption: "RAW",
            requestBody: { values },
        });
        console.log(`[Sheets] ${id} updated with ${tariffs.length} rows.`);
    }
}