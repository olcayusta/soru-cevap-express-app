import { pool } from '../../app'

export class TagService {
  async getAllTags() {
    const {rows} = await pool.query(`select t.id, t.title, COUNT(t.id) as "questionCount"
                                   from tag t
                                            inner join question_tag qt on qt."tagId" = t.id
                                   group by t.id
                                   order by "questionCount" desc`)
    return rows
  }
}
