import { UserService } from './user.service'

class UserController {
  constructor(
    private userService: UserService
  ) {
  }

  getAllUsers() {
    return this.userService.getUsersForCache()
  }

  getData() {
    return this.userService.getData()
  }

  getUserById(userId: number) {
    return this.userService.getUserById(userId)
  }
}

export const userController = new UserController(
  new UserService
)

