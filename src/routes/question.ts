import { pool } from '../app'
import { Application } from 'express'

export default (app: Application) => {
  app.get('/:questionId/answers', async (req, res) => {
    const {questionId} = req.params
    try {
      const sql = `SELECT *
                   FROM question_answer
                   WHERE "questionId" = $1`
      const {rows} = await pool.query(sql, [questionId])
      res.json(rows)
    } catch (e) {
      throw e
    }
  })
  app.get('/questions/:questionId', async (req, res) => {
    const {questionId} = req.params
    const sql = `SELECT q.*,
                        (
                            SELECT row_to_json(u)
                            FROM "user" u
                            WHERE u.id = q."userId"
                        ) AS "user"
                 FROM question q
                 WHERE q.id = $1`
    const {rows} = await pool.query(sql, [questionId])
    const updateViewCount = await pool.query(`UPDATE question
                                              SET "viewCount" = "viewCount" + 1
                                              WHERE id = $1`, [questionId])
    res.json(rows[0])
  })
}
