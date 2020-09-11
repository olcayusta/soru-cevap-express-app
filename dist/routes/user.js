"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../components/user/user.controller");
const app_1 = require("../app");
exports.default = (app) => {
    app.post('/users', async (req, res) => {
        /*    const {isEmpty, array} = await validationResult(req)
            if (isEmpty()) {
                return res.status(400).json({errors: array()})
    
            }*/
        const { email, password, displayName, picture } = req.body;
        const sql = `INSERT INTO "user" (email, password, "displayName", picture)
                 VALUES ($1, $2, $3, $4)`;
        const { rows } = await app_1.pool.query(sql, [email, password, displayName, picture]);
        res.json(rows[0]);
    });
    app.get('/users', async (req, res) => {
        console.log('fuck');
        // @ts-ignore
        const { rows } = await app.pg.query(`SELECT id, "displayName", picture, "signupDate"
                                       FROM "user"`);
        res.json(rows);
    });
    app.get('/users/:userId', async (req, res) => {
        const { userId } = req.params;
        const user = await user_controller_1.userController.getUserById(+userId);
        res.json(user);
    });
};
