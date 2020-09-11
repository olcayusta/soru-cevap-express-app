import { pool } from '../../app'
import { cacheService } from '../../services/cache.service'
import { userRepo } from './user.repo'
import { User } from '../../models/user'

export class UserService {
  async getUsers(): Promise<User[]> {
      return await userRepo.getUserRepo()
  }

  async getUsersForCache() {
    return cacheService.get('getUsers')
  }

  async getData() {
    return await userRepo.getUserRepo()
  }

  async getUserById(userId: number): Promise<any> {
    const cache = cacheService.get('getUserById')
    if (!cache) {
      const {rows} = await pool.query(`SELECT id, "displayName", picture, "signupDate"
                                       FROM "user"
                                       WHERE id = $1`, [userId])
      cacheService.set('getUserById', rows[0])
    }
    return cacheService.get('getUserById')
  }
}
