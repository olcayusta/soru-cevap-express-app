"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    getAllUsers() {
        return this.userService.getUsersForCache();
    }
    getData() {
        return this.userService.getData();
    }
    getUserById(userId) {
        return this.userService.getUserById(userId);
    }
}
exports.userController = new UserController(new user_service_1.UserService);
