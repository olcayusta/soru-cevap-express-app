"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const app_1 = require("../app");
const cache_service_1 = require("./cache.service");
const user_repo_1 = require("../repository/user.repo");
class UserService {
    async getUsers() {
        if (!cache_service_1.cacheService.get('getUsers')) {
            const users = await user_repo_1.userRepo.getUserRepo();
            cache_service_1.cacheService.set('getUsers', users);
        }
        return cache_service_1.cacheService.get('getUsers');
    }
    async getUsersForCache() {
        return cache_service_1.cacheService.get('getUsers');
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
exports.userService = new UserService();
