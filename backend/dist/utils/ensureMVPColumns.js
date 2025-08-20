"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMVPColumns = ensureMVPColumns;
const database_1 = __importDefault(require("./database"));
async function ensureMVPColumns() {
    try {
        await database_1.default.query(`ALTER TABLE IF EXISTS file_uploads
         ADD COLUMN IF NOT EXISTS file_content BYTEA`);
    }
    catch (err) {
        console.error('ensureMVPColumns: failed to ensure columns', err);
    }
}
//# sourceMappingURL=ensureMVPColumns.js.map