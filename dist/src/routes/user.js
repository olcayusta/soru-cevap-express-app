"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (app) => {
    app.get('/native', async (req, res) => {
        res.send('Woody woodpecker..');
    });
};
