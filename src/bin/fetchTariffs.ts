#!/usr/bin/env ts-node
import "dotenv/config";
import { fetchAndStoreTariffs } from "../services/wbTariffsService.js";

fetchAndStoreTariffs()
    .then(() => {
        console.log("Done.");
        process.exit(0);
    })
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    });