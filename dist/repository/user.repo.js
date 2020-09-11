"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepo = void 0;
const app_1 = require("../app");
class UserRepo {
    async getUserRepo() {
        const sql = `SELECT id, "displayName", picture, "signupDate"
                     FROM "user"`;
        const { rows } = await app_1.pool.query(sql);
        return rows;
    }
}
exports.userRepo = new UserRepo();
