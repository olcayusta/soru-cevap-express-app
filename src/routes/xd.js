import {pool} from "../app";

export default async (app) => {
    app.get('/native', async (req, res) => {
        res.send('Woody woodpecker..')
    })
}

export const getUser = async (app) => {
    return pool.query('select * from "user"')
}

