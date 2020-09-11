"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const app_1 = require("../../app");
const cache_service_1 = require("../../services/cache.service");
const user_repo_1 = require("./user.repo");
class UserService {
    async getUsers() {
        return await user_repo_1.userRepo.getUserRepo();
    }
    async getUsersForCache() {
        return cache_service_1.cacheService.get('getUsers');
    }
    async getData() {
        return await user_repo_1.userRepo.getUserRepo();
    }
    async getUserById(userId) {
        const cache = cache_service_1.cacheService.get('getUserById');
        if (!cache) {
            const { rows } = await app_1.pool.query(`SELECT id, "displayName", picture, "signupDate"
                                       FROM "user"
                                       WHERE id = $1`, [userId]);
            cache_service_1.cacheService.set('getUserById', rows[0]);
        }
        return cache_service_1.cacheService.get('getUserById');
    }
}
exports.UserService = UserService;
