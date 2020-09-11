import express from 'express'
import cors from 'cors'
import compression from 'compression'
import jwt from 'jsonwebtoken'
import expressJwt from 'express-jwt'
import { parse } from 'marked'
import { Pool } from 'pg'
import sharp from 'sharp'

// Services
import { socketService } from './services/socket.service'
import { cacheService } from './services/cache.service'

import NotificationController from './controllers/notification.controller';
import { helloController } from './controllers';

helloController.yazdir()

// POSTGRES
export const pool = new Pool({
  database: 'qa_beta',
  user: 'postgres',
  password: '123456',
  max: 1
})

// App
const app = express()

// Routes
/*import user from './routes/user'

app.use('/users', user)*/

// @ts-ignore
app.pg = pool


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

app.use(cors())
app.use(compression())
app.use(express.json())

// TODO: Nginx gecildikten sonra kaldirilacak
app.use('/public', express.static('public'))

app.get('/notifications', expressJwt({
  secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
  // @ts-ignore
  const {userId} = req.user.sub
  const rows = await NotificationController.getAllNotificationList();
  res.json(rows)
})

app.get('/unseen_count', expressJwt({
  secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
  // @ts-ignore
  const {userId} = req.user.sub
  const sql = `SELECT COUNT(*)::INTEGER
               FROM notification
               WHERE "receiverId" = $1
                 AND NOT "isRead"`
  const {rows} = await pool.query(sql, [userId])
  res.json(rows[0].count)
})

/**
 * Routes
 * @route GET /resize/:size
 */
app.get('/resize/:size', async (req, res) => {
  const {size} = req.params

  const value = cacheService.get("myKey");
  if (value == undefined) {

    res.setHeader('Cache-Control', 'max-age=31536000');
    res.setHeader('Content-Type', 'image/jpeg')

    sharp('img01.jpg').webp({
      quality: 70
    }).resize(+size, +size).toBuffer((err, buffer, info) => {
      const obj = {my: 'Special', variable: 42, picture: buffer}
      const success = cacheService.set('myKey', obj, 10000)
    }).pipe(res)
  } else {
    res.setHeader('Cache-Control', 'max-age=31536000');
    res.setHeader('Content-Type', 'image/jpeg')

    // console.log(cacheService.getStats())

    // @ts-ignore
    sharp(value.picture).pipe(res)
  }
})

app.post('/answers', expressJwt({
  secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
  const {content, questionId} = req.body

  try {
    // @ts-ignore
    const userId = +req.user.sub

    const sql = `INSERT INTO question_answer (content, "userId", "questionId")
                 VALUES ($1, $2, $3)
                 RETURNING *`
    const {rows} = await pool.query(sql, [content, userId, questionId])

    // TODO: Send notification to author (refactor)
    const notificationSql = `SELECT "userId"
                             FROM question q
                             WHERE q.id = $1`
    const usersQueryResult = await pool.query(notificationSql, [questionId])
    const uId = usersQueryResult.rows[0]
    console.log(uId)

    const {celebName, picture} = await socketService.sendNotification('Test 1')
    console.log(`${celebName}'in resim linki: ${picture}`)

    res.json(rows[0])

  } catch (e) {
    throw e
  }
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

app.get('/me', async (req, res) => {
  const {rows} = await pool.query('SELECT * FROM "user" WHERE id = 1')
  res.json(rows[0])
})

app.get('/tags', expressJwt({
  secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
  const sql = `SELECT t.id, t.title, COUNT(t.id) AS "questionCount"
               FROM tag t
                        INNER JOIN question_tag qt ON qt."tagId" = t.id
               GROUP BY t.id
               ORDER BY "questionCount" DESC`
  const {rows} = await pool.query(sql)
  res.json(rows)
})

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

// const getUsers = () => pool.query(`select id, "displayName", picture, "signupDate" FROM "user"`)

app.get('/users/:userId/questions', async (req, res) => {
  const {userId} = req.params
  const sql = `SELECT *
               FROM question
               WHERE "userId" = $1`
  const {rows} = await pool.query(sql, [userId])
  res.json(rows)
})

app.get('/users/:userId/answers', async (req, res) => {
  const {userId} = req.params
  const sql = `SELECT *
               FROM question_answer
               WHERE "userId" = $1`
  const {rows} = await pool.query(sql, [userId])
  res.json(rows)
})

// Routes
user(app)
import routes from './routes'

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
