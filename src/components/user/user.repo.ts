import { pool } from '../../app';

class UserRepo {
  async getUserRepo(): Promise<any> {
    const sql = `select id, "displayName", picture, "signupDate"
                 from "user"`
    const {rows} = await pool.query(sql)
    return rows
  }
}

export const userRepo = new UserRepo()
