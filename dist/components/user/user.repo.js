"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepo = void 0;
const app_1 = require("../../app");
class UserRepo {
    async getUserRepo() {
        const sql = `select id, "displayName", picture, "signupDate"
                 from "user"`;
        const { rows } = await app_1.pool.query(sql);
        return rows;
    }
}
exports.userRepo = new UserRepo();
