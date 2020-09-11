"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (app) => {
    app.get('/', async (req, reply) => {
        return {
            hello: 'world'
        };
    });
};
