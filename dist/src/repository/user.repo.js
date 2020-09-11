"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepo = void 0;
const app_1 = require("../app");
class UserRepo {
    async getUserRepo() {
        const { rows } = await app_1.pool.query(`SELECT id, "displayName", picture, "signupDate"
                                         FROM "user"`);
        return rows;
    }
}
exports.userRepo = new UserRepo();
