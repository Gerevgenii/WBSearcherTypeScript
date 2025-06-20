#!/usr/bin/env ts-node
import "dotenv/config";
import { updateAllSheets } from "../services/googleSheetsService.js";

updateAllSheets()
    .then(() => {
        console.log("Sheets updated.");
        process.exit(0);
    })
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    });