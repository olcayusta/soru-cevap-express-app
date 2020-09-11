"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = void 0;
const app_1 = require("../app");
exports.default = async (app) => {
    app.get('/native', async (req, res) => {
        res.send('Woody woodpecker..');
    });
};
exports.getUser = async (app) => {
    return app_1.pool.query('select * from "user"');
};
