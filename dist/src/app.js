"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_jwt_1 = __importDefault(require("express-jwt"));
const marked_1 = require("marked");
const pg_1 = require("pg");
const sharp_1 = __importDefault(require("sharp"));
const express_validator_1 = require("express-validator");
/**
 * Services
 */
const socket_service_1 = require("./services/socket.service");
const cache_service_1 = require("./services/cache.service");
const user_service_1 = require("./services/user.service");
const user_1 = __importDefault(require("./routes/user"));
const notification_service_1 = require("./services/notification.service");
/**
 * Initialize postgres pool
 */
exports.pool = new pg_1.Pool({
    database: 'qa_beta',
    user: 'postgres',
    password: '123456'
});
/**
 * App
 */
const app = express_1.default();
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
app.use(cors_1.default());
app.use(compression_1.default());
app.use(express_1.default.json());
/**
 * Inject routes
 */
user_1.default(app);
/**
 * Express static files
 */
app.use('/public', express_1.default.static('public'));
/**
 * Get user notifications
 * @route GET /notifications
 */
app.get('/notifications', express_jwt_1.default({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    // @ts-ignore
    const { userId } = req.user.sub;
    const { rows } = await notification_service_1.notificationService.getNotifications(+userId);
    res.json(rows);
});
/**
 * Unseen notification count
 * @route GET /unseen
 */
app.get('/unseen_count', express_jwt_1.default({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    try {
        // @ts-ignore
        const { userId } = req.user.sub;
        const sql = `SELECT COUNT(*)::INTEGER
                     FROM notification
                     WHERE "receiverId" = $1
                       AND NOT "isRead"`;
        const { rows } = await exports.pool.query(sql, [userId]);
        res.json(rows[0].count);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Routes
 * @route GET /resize/:size
 */
app.get('/resize/:size', async (req, res) => {
    const { size } = req.params;
    const value = cache_service_1.cacheService.get("myKey");
    if (value == undefined) {
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.setHeader('Content-Type', 'image/jpeg');
        sharp_1.default('img01.jpg').webp({
            quality: 70
        }).resize(+size, +size).toBuffer((err, buffer, info) => {
            const obj = { my: 'Special', variable: 42, picture: buffer };
            const success = cache_service_1.cacheService.set('myKey', obj, 10000);
        }).pipe(res);
    }
    else {
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.setHeader('Content-Type', 'image/jpeg');
        // console.log(cacheService.getStats())
        // @ts-ignore
        sharp_1.default(value.picture).pipe(res);
    }
});
/**
 * Search
 * @route GET /search/:searchTerm
 */
app.get('/search/:searchTerm', async (req, res) => {
    const { searchTerm } = req.params;
    try {
        const tsQuery = `${searchTerm}:*`;
        const sql = `SELECT q.id, q.title
                     FROM question q
                     WHERE to_tsvector(title) @@ to_tsquery($1)`;
        const { rows } = await exports.pool.query(sql, [tsQuery]);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Get question answers
 * @route GET /:questionId/answers
 */
app.get('/:questionId/answers', async (req, res) => {
    const { questionId } = req.params;
    try {
        const sql = `SELECT *
                     FROM question_answer
                     WHERE "questionId" = $1`;
        const { rows } = await exports.pool.query(sql, [questionId]);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Create an answer.
 * @route POST /answers
 */
app.post('/answers', express_jwt_1.default({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    const { content, questionId } = req.body;
    try {
        // @ts-ignore
        const userId = +req.user.sub;
        const sql = `INSERT INTO question_answer (content, "userId", "questionId")
                     VALUES ($1, $2, $3)
                     RETURNING *`;
        const { rows } = await exports.pool.query(sql, [content, userId, questionId]);
        // TODO: Send notification to author (refactor)
        const notificationSql = `SELECT "userId"
                                 FROM question q
                                 WHERE q.id = $1`;
        const usersQueryResult = await exports.pool.query(notificationSql, [questionId]);
        const uId = usersQueryResult.rows[0];
        console.log(uId);
        const { celebName, picture } = await socket_service_1.socketService.sendNotification('Test 1');
        console.log(`${celebName}'in resim linki: ${picture}`);
        res.json(rows[0]);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Log in.
 * @route POST /login
 */
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const sql = `SELECT id, email, "displayName", picture
                     FROM "user"
                     WHERE email = $1
                       AND password = $2`;
        const { rows, rowCount } = await exports.pool.query(sql, [email, password]);
        const user = rows[0];
        if (rowCount) {
            // jwt sign
            const token = jsonwebtoken_1.default.sign({
                user
            }, "jojo", {
                expiresIn: '24h',
                subject: user.id.toString()
            });
            // set token user
            user.token = token;
            // RETURN
            res.json({
                user,
                token,
                message: 'create user succesfully'
            });
        }
        else {
            res.send({
                error: true,
                code: 404,
                msg: 'User not found'
            });
        }
    }
    catch (e) {
        throw e;
    }
});
/**
 * Me
 */
app.get('/me', async (req, res) => {
    try {
        const { rows } = await exports.pool.query('SELECT * FROM "user" WHERE id = 1');
        res.json(rows[0]);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Tags
 * @route GET /tags
 */
app.get('/tags', express_jwt_1.default({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    try {
        const sql = `SELECT t.id, t.title, COUNT(t.id) AS "questionCount"
                     FROM tag t
                              INNER JOIN question_tag qt ON qt."tagId" = t.id
                     GROUP BY t.id
                     ORDER BY "questionCount" DESC`;
        const { rows } = await exports.pool.query(sql);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Tag
 * @route GET /tags/:tagId
 */
app.get('/tags/:tagId', async (req, res) => {
    const { tagId } = req.params;
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
                     WHERE t.id = $1`;
        const { rows } = await exports.pool.query(sql, [tagId]);
        res.json(rows[0]);
    }
    catch (e) {
        throw e;
    }
});
// const getUsers = () => pool.query(`select id, "displayName", picture, "signupDate" FROM "user"`)
/**
 * Get all users
 * @route GET /users
 */
app.get('/users', async (req, res) => {
    const rows = await user_service_1.userService.getUsers();
    res.json(rows);
});
/**
 * Get user by id
 * @route GET /users/:userId
 */
app.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const user = await user_service_1.userService.getUserById(+userId);
    res.json(user);
});
/**
 * Get questions by user id
 * @route GET /users/:userId/questions
 */
app.get('/users/:userId/questions', async (req, res) => {
    try {
        const { userId } = req.params;
        const sql = `SELECT *
                     FROM question
                     WHERE "userId" = $1`;
        const { rows } = await exports.pool.query(sql, [userId]);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Get user answers
 * @route GET /users/:userId/answers
 */
app.get('/users/:userId/answers', async (req, res) => {
    try {
        const { userId } = req.params;
        const sql = `SELECT *
                     FROM question_answer
                     WHERE "userId" = $1`;
        const { rows } = await exports.pool.query(sql, [userId]);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
const userValidationRules = () => {
    return [
        // username must be an email
        express_validator_1.body('email').isEmail(),
        // password must be at least 5 chars long
        express_validator_1.body('password').isLength({ min: 6 }),
    ];
};
const validate = (req, res, next) => {
    const errors = express_validator_1.validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
    return res.status(422).json({
        errors: extractedErrors,
    });
};
/**
 * Create a new user
 * @route GET /users
 */
app.post('/users', userValidationRules(), validate, (req, res) => {
    console.log(req.body);
    /*    const {isEmpty, array} = await validationResult(req)
        if (isEmpty()) {
            return res.status(400).json({errors: array()})

        }*/
    /* try {
         const {email, password, displayName, picture} = req.body
         const sql = `INSERT INTO "user" (email, password, "displayName", picture)
                      VALUES ($1, $2, $3, $4)`
         const {rows} = await pool.query(sql, [email, password, displayName, picture])
         res.json(rows[0])
     } catch (e) {
         throw e
     }*/
});
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
                     ORDER BY q.id DESC`;
        const { rows } = await exports.pool.query(sql);
        res.json(rows);
    }
    catch (e) {
        throw e;
    }
});
/**
 * Get questions by offset
 * @route GET /questions/loadmore/:offset
 */
app.get('/questions/loadmore/:offset', async (req, res) => {
    const { offset } = req.params;
    const sql = `SELECT q.*,
                        (
                            SELECT row_to_json(u)
                            FROM "user" u
                            WHERE u.id = q."userId"
                        ) AS "user"
                 FROM question q
                 ORDER BY q.id DESC
                 LIMIT 6 OFFSET $1`;
    const { rows } = await exports.pool.query(sql, [offset]);
    res.json(rows);
});
/**
 * Get question by id
 * @route GET /questions/:questionId
 */
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
    const { rows } = await exports.pool.query(sql, [questionId]);
    const updateViewCount = await exports.pool.query(`UPDATE question
                                              SET "viewCount" = "viewCount" + 1
                                              WHERE id = $1`, [questionId]);
    res.json(rows[0]);
});
/**
 * Create a new question
 * @route GET /questions
 */
app.post('/questions', express_jwt_1.default({
    secret: 'jojo', algorithms: ['HS256']
}), async (req, res) => {
    const { title, content } = req.body;
    // @ts-ignore
    const userId = +req.user.sub;
    try {
        const sql = `INSERT INTO "question" (title, content, "rawContent", "userId")
                     VALUES ($1, $2, $3, $4)`;
        const { rows } = await exports.pool.query(sql, [title, marked_1.parse(content), content, userId]);
        res.json(rows[0]);
    }
    catch (e) {
        throw e;
    }
});
exports.default = app;
