"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
exports.default = (app) => {
    user_1.default(app);
    return app;
};
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
