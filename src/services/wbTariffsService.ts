import axios from "axios";
import knex from "../postgres/knex.js";
import fs from "fs";

const WB_TARIFFS_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";

type WBTariff = {
    warehouse: string;
    deliveryAndStorage: number;
    deliveryBase: number;
    deliveryLiter: number;
    storageBase: number;
    storageLiter: number;
};

type RawTariff = {
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxStorageBase: string;
    boxStorageLiter: string;
    warehouseName: string;
};

export async function fetchAndStoreTariffs(): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    const token = fs.readFileSync("/run/secrets/wb_api_token", "utf8").trim();

    const headers: Record<string,string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${WB_TARIFFS_URL}?date=${date}`;
    const response = await axios.get(url, { headers });
    const rawList: RawTariff[] =
        response.data?.response?.data?.warehouseList ?? [];

    const tariffs: WBTariff[] = rawList.map((r) => ({
        warehouse: r.warehouseName,
        deliveryAndStorage: parseFloat(r.boxDeliveryAndStorageExpr.replace(',', '.')),
        deliveryBase: parseFloat(r.boxDeliveryBase.replace(',', '.')),
        deliveryLiter: parseFloat(r.boxDeliveryLiter.replace(',', '.')),
        storageBase: parseFloat(r.boxStorageBase.replace(',', '.')),
        storageLiter: parseFloat(r.boxStorageLiter.replace(',', '.')),
    }));

    console.log(`[WB] Parsed ${tariffs.length} tariffs for ${date}`);

    for (const t of tariffs) {
        await knex("daily_tariffs")
            .insert({
                day: date,
                warehouse: t.warehouse,
                delivery_and_storage: t.deliveryAndStorage,
                delivery_base: t.deliveryBase,
                delivery_liter: t.deliveryLiter,
                storage_base: t.storageBase,
                storage_liter: t.storageLiter,
            })
            .onConflict(["day", "warehouse"])
            .merge();
    }

    console.log(`[WB] tariffs stored for ${date}, count=${tariffs.length}`);
}
