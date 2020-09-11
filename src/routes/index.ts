import { Application, Request, Response } from 'express'
import user from './user'

export default (app: Application) => {
  user(app)

  return app
}

/*export default async (app) => {
    app.get('/', async (req, reply) => {
        return {
            hello: 'world'
        }
    })
}*/

/*
import { Router } from 'express'
import user from './user'

export default () => {
    const app = Router()
    user(app)

    return app
}
*/
