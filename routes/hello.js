export default async function (app) {
    app.get('/', async (req, reply) => {
        return {
            hello: 'world'
        }
    })
}
