"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const app_1 = require("../../app");
class TagService {
    async getAllTags() {
        const { rows } = await app_1.pool.query(`select t.id, t.title, COUNT(t.id) as "questionCount"
                                   from tag t
                                            inner join question_tag qt on qt."tagId" = t.id
                                   group by t.id
                                   order by "questionCount" desc`);
        return rows;
    }
}
exports.TagService = TagService;
