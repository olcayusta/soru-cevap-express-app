"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloController = void 0;
const hello_controller_1 = require("./hello.controller");
const hello_service_1 = require("./hello.service");
const helloController = new hello_controller_1.HelloController(new hello_service_1.HelloService());
exports.helloController = helloController;
