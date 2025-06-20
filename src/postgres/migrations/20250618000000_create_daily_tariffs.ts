import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("daily_tariffs", (t) => {
        t.date("day").notNullable();
        t.string("warehouse").notNullable();
        t.decimal("delivery_and_storage", 10, 4).notNullable();
        t.decimal("delivery_base", 10, 4).notNullable();
        t.decimal("delivery_liter", 10, 4).notNullable();
        t.decimal("storage_base", 10, 4).notNullable();
        t.decimal("storage_liter", 10, 4).notNullable();
        t.unique(["day", "warehouse"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("daily_tariffs");
}