import express, { Request, Response } from 'express'
import cors from 'cors'
import compression from 'compression'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import { parse } from 'marked'
import { Pool } from 'pg'
import Redis from 'ioredis'
import ws from 'ws'
import { wss1 } from './ws'
import sharp from 'sharp'
import NodeCache from 'node-cache'

/**
 * Services
 */
import { socketService } from './services/socket.service'

/**
 * Initialize postgres pool
 */
const pool = new Pool({
    database: 'soru_cevap_beta',
    user: 'postgres',
    password: '123456'
})

/**
 * Initialize cache
 */
const myCache = new NodeCache();

/**
 * App
 */
const app = express()

/**
 * Redis Init
 */
/*const redis = new Redis()
redis.set('foo', 'bar')

redis.get('foo', (err, res) => {
    if (err) {
        console.error(err)
    } else {
        console.log(res)
    }
})*/

/**
 * Express plugins
 */
app.use(cors())
app.use(compression())
app.use(express.json())

/**
 * Express static files
 */
app.use('/public', express.static('public'))

/*app.get('/public/:imgName', async (req, res) => {
    console.log(req.params.imgName)
})*/

/**
 * Routes
 * @route GET /resize/:size
 */
app.get('/resize/:size', async (req: Request, res: Response) => {
    const {size} = req.params

    const value = myCache.get("myKey");
    if (value == undefined) {

        res.setHeader('Cache-Control', 'max-age=31536000');
        res.setHeader('Content-Type', 'image/jpeg')

        sharp('img01.jpg').webp({
            quality: 70
        }).resize(+size, +size).toBuffer((err, buffer, info) => {
            const obj = {my: 'Special', variable: 42, picture: buffer}
            const success = myCache.set('myKey', obj, 10000)
        }).pipe(res)
    } else {
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.setHeader('Content-Type', 'image/jpeg')

        // console.log(myCache.getStats())

        // @ts-ignore
        sharp(value.picture).pipe(res)
    }
})

/**
 * Search
 * @route GET /search/:searchTerm
 */
app.get('/search/:searchTerm', async (req, res) => {
    const {searchTerm} = req.params
    const tsQuery = `${searchTerm}:*`
    const sql = `SELECT q.id, q.title
                 FROM question q
                 WHERE to_tsvector(title) @@ to_tsquery($1)`
    const {rows} = await pool.query(sql, [tsQuery])
    res.json(rows)
})

/**
 *
 * @route GET /:questionId/answers
 */
app.get('/:questionId/answers', async (req, res) => {
    const {questionId} = req.params
    const sql = `SELECT *
                 FROM question_answer
                 WHERE "questionId" = $1`
    const {rows} = await pool.query(sql, [questionId])
    res.json(rows)
})

/**
 * Create an answer.
 * @route POST /answers
 */
app.post('/answers', expressJwt({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {

    // save answer
    const {content, questionId} = req.body

    // @ts-ignore
    const userId = +req.user.sub

    const sql = `INSERT INTO question_answer (content, "userId", "questionId")
                 VALUES ($1, $2, $3)
                 RETURNING *`
    const {rows} = await pool.query(sql, [content, userId, questionId])

    // TODO: Send notification to author (refactor)
    const sql2 = `SELECT "userId"
                  FROM question q
                  WHERE q.id = $1`
    const usersQueryResult = await pool.query(sql2, [questionId])
    const uId = usersQueryResult.rows[0]
    console.log(uId)

    const {celebName, picture} = await socketService.sendNotification('Test 1')
    console.log(`${celebName}'in resim linki: ${picture}`)


    res.json(rows[0])
})

/**
 * Log in.
 * @route POST /login
 */
app.post('/login', async (req, res) => {
    const {email, password} = req.body

    try {
        const sql = `SELECT id, email, "displayName", picture
                     FROM "user"
                     WHERE email = $1
                       AND password = $2`
        const {rows, rowCount} = await pool.query(sql, [email, password])
        const user = rows[0]

        if (rowCount) {
            // jwt sign
            const token = jwt.sign({
                user
            }, "jojo", {
                expiresIn: '24h',
                subject: user.id.toString()
            })

            // set token user
            user.token = token

            // RETURN
            res.json({
                user,
                token,
                message: 'create user succesfully'
            })
        } else {
            res.send({
                error: true,
                code: 404,
                msg: 'User not found'
            })
        }
    } catch (e) {
        throw  e
    }
})

/**
 * Me
 */
app.get('/me', async (req, res) => {
    try {
        const {rows} = await pool.query('SELECT * FROM "user" WHERE id = 1')
        res.json(rows[0])
    } catch (e) {
        throw e
    }
})

/**
 * Tags
 * @route GET /tags
 */
app.get('/tags', expressJwt({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    try {
        const sql = `SELECT t.id, t.title, COUNT(t.id) AS "questionCount"
                     FROM tag t
                              INNER JOIN question_tag qt ON qt."tagId" = t.id
                     GROUP BY t.id
                     ORDER BY "questionCount" DESC`
        const {rows} = await pool.query(sql)
        res.json(rows)
    } catch (e) {
        throw e
    }
})

/**
 * Tag
 * @route GET /tags/:tagId
 */
app.get('/tags/:tagId', async (req, res) => {
    const {tagId} = req.params
    try {
        const sql = `SELECT t.id,
                            t.title,
                            t.description,
                            (
                                SELECT jsonb_agg(
                                               jsonb_build_object(
                                                       'id', q.id,
                                                       'title', q.title,
                                                       'creationTime', q."creationTime",
                                                       'user', (
                                                           SELECT jsonb_build_object(
                                                                          'id', id,
                                                                          'displayName', "displayName",
                                                                          'picture', picture)
                                                           FROM "user" u
                                                           WHERE u.id = q."userId"
                                                       ),
                                                       'tags', (
                                                           SELECT jsonb_agg(jsonb_build_object('id', t1.id, 'title', t1.title))
                                                           FROM tag t1
                                                           WHERE t1.id IN
                                                                 (SELECT qt2."tagId"
                                                                  FROM question_tag qt2
                                                                  WHERE qt2."questionId" = q.id)
                                                       )
                                                   ) ORDER BY q.id DESC)
                                FROM question q
                                WHERE q.id IN (SELECT qt."questionId" FROM question_tag qt WHERE qt."tagId" = t.id)
                            ) AS "questions"
                     FROM tag t
                     WHERE t.id = $1`
        const {rows} = await pool.query(sql, [tagId])
        res.json(rows[0])
    } catch (e) {
        throw e
    }
})

/**
 * Get all users
 * @route GET /users
 */
app.get('/users', async (req, res) => {
    if (myCache.get('get_all_users')) {
        const users = myCache.get('get_all_users')
        console.log(`Veri Cache'ten geldi`);
        res.json(users)
    } else {
        console.log(`Veri POSTGRES'ten geldi`);
        try {
            const sql = `SELECT id, "displayName", picture, "signupDate"
                         FROM "user"`
            const {rows} = await pool.query(sql)
            myCache.set('get_all_users', rows)

            for (let i = 0; i < 50000; i++) {
                myCache.set(`get_all_users${i}`, rows)
            }

            console.log(myCache.getStats());

            res.json(rows)
        } catch (e) {
            throw e
        }
    }
})

/**
 * Get user by id
 * @route GET /users/:userId
 */
app.get('/users/:userId', async (req, res) => {
    try {
        const {userId} = req.params
        const sql = `SELECT id, "displayName", picture, "signupDate"
                     FROM "user"
                     WHERE id = $1`
        const {rows} = await pool.query(sql, [userId])
        res.json(rows[0])
    } catch (e) {
        throw e
    }
})

/**
 * Get questions by user id
 * @route GET /users/:userId/questions
 */
app.get('/users/:userId/questions', async (req, res) => {
    try {
        const {userId} = req.params
        const sql = `SELECT *
                     FROM question
                     WHERE "userId" = $1`
        const {rows} = await pool.query(sql, [userId])
        res.json(rows)
    } catch (e) {
        throw e
    }
})

/**
 * Get user answers
 * @route GET /users/:userId/answers
 */
app.get('/users/:userId/answers', async (req, res) => {
    try {
        const {userId} = req.params
        const sql = `SELECT *
                     FROM question_answer
                     WHERE "userId" = $1`
        const {rows} = await pool.query(sql, [userId])
        res.json(rows)
    } catch (e) {
        throw e
    }
})

/**
 * Create a new user
 * @route GET /users
 */
app.post('/users', async (req, res) => {
    try {
        const {email, password, displayName, picture} = req.body
        const sql = `INSERT INTO "user" (email, password, "displayName", picture)
                     VALUES ($1, $2, $3, $4)`
        const {rows} = await pool.query(sql, [email, password, displayName, picture])
        res.json(rows[0])
    } catch (e) {
        throw e
    }
})

/**
 * Get all questions
 * @route GET /questions
 */
app.get('/questions', async (req, res) => {
    try {
        const sql = `SELECT q.id,
                            q."creationTime",
                            q.content,
                            q.title,
                            (
                                SELECT jsonb_agg(
                                               jsonb_build_object('id', t.id, 'title', t.title)
                                           )
                                FROM tag t
                                         LEFT JOIN question_tag qt on t.id = qt."tagId"
                                WHERE qt."questionId" = q.id
                            ) AS tags,
                            (
                                SELECT jsonb_build_object('id', id, 'displayName', "displayName", 'picture', picture)
                                FROM "user" u
                                WHERE u.id = q."userId"
                            ) AS "user"
                     FROM question q
                     ORDER BY q.id DESC`
        const {rows} = await pool.query(sql)
        res.json(rows)
    } catch (e) {
        throw e
    }
})

/**
 * Get questions by offset
 * @route GET /questions/loadmore/:offset
 */
app.get('/questions/loadmore/:offset', async (req, res) => {
    const {offset} = req.params
    const sql = `SELECT q.*,
                        (
                            SELECT row_to_json(u)
                            FROM "user" u
                            WHERE u.id = q."userId"
                        ) AS "user"
                 FROM question q
                 ORDER BY q.id DESC
                 LIMIT 6 OFFSET $1`
    const {rows} = await pool.query(sql, [offset])
    res.json(rows)
})

/**
 * Get question by id
 * @route GET /questions/:questionId
 */
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

/**
 * Create a new question
 * @route GET /questions
 */
app.post('/questions', expressJwt({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    const {title, content} = req.body

    // @ts-ignore
    const userId = +req.user.sub

    try {
        const sql = `INSERT INTO "question" (title, content, "rawContent", "userId")
                     VALUES ($1, $2, $3, $4)`
        const {rows} = await pool.query(sql, [title, parse(content), content, userId])
        res.json(rows[0])
    } catch (e) {
        throw e
    }
})

export default app
