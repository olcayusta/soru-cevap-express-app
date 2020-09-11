"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
exports.default = (app) => {
    app.get('/:questionId/answers', async (req, res) => {
        const { questionId } = req.params;
        try {
            const sql = `SELECT *
                   FROM question_answer
                   WHERE "questionId" = $1`;
            const { rows } = await app_1.pool.query(sql, [questionId]);
            res.json(rows);
        }
        catch (e) {
            throw e;
        }
    });
    app.get('/questions/:questionId', async (req, res) => {
        const { questionId } = req.params;
        const sql = `SELECT q.*,
                        (
                            SELECT row_to_json(u)
                            FROM "user" u
                            WHERE u.id = q."userId"
                        ) AS "user"
                 FROM question q
                 WHERE q.id = $1`;
        const { rows } = await app_1.pool.query(sql, [questionId]);
        const updateViewCount = await app_1.pool.query(`UPDATE question
                                              SET "viewCount" = "viewCount" + 1
                                              WHERE id = $1`, [questionId]);
        res.json(rows[0]);
    });
};
