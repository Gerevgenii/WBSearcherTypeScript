/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: process.env.SHEET_IDS }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}