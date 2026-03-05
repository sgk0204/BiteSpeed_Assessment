"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identity_1 = require("./controllers/identity");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('BiteSpeed Identity Reconciliation API is running.');
});
app.post('/identify', identity_1.identify);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
