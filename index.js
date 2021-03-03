"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var bcrypt_1 = __importDefault(require("bcrypt"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var express_validator_1 = require("express-validator");
var app = express_1.default();
app.use(body_parser_1.default.json());
app.use(cors_1.default());
var PORT = process.env.PORT || 3000;
var SECRET = "SIMPLE_SECRET";
var db = [];
app.post('/login', express_validator_1.body('username').isString(), express_validator_1.body('password').isString(), function (req, res) {
    if (!express_validator_1.validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" });
    var _a = req.body, username = _a.username, password = _a.password;
    var user = db.find(function (x) { return x.username === username; });
    if (!user)
        return res.status(400).send({
            message: 'Invalid username or password'
        });
    if (!bcrypt_1.default.compareSync(password, user.hashedPassword))
        return res.status(400).send({
            message: 'Invalid username or password'
        });
    var token = jsonwebtoken_1.default.sign({
        username: user.username,
        password: password
    }, SECRET);
    return res.send({
        message: 'Login succesfully',
        token: token
    });
});
app.post('/register', express_validator_1.body('username').isString(), express_validator_1.body('password').isString(), express_validator_1.body('firstname').isString(), express_validator_1.body('lastname').isString(), express_validator_1.body('balance').isInt(), function (req, res) {
    if (!express_validator_1.validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" });
    var _a = req.body, username = _a.username, password = _a.password, firstname = _a.firstname, lastname = _a.lastname, balance = _a.balance;
    var hashedPassword = bcrypt_1.default.hashSync(password, 10);
    //validate
    if (db.filter(function (x) { return x.username === username; }).length > 0) {
        res.status(400).send({
            "message": "Username is already in used"
        });
        return;
    }
    var account = {
        username: username, hashedPassword: hashedPassword, firstname: firstname, lastname: lastname, balance: balance
    };
    db.push(account);
    console.log(db);
    res.send({
        message: "Register successfully"
    });
});
app.get('/balance', express_validator_1.query('token').isString(), function (req, res) {
    var _a;
    var token = (_a = req.query) === null || _a === void 0 ? void 0 : _a.token;
    try {
        var username_1 = jsonwebtoken_1.default.verify(token, SECRET).username;
        var account = db.find(function (x) { return x.username === username_1; });
        //validate
        if (!account)
            return res.status(400).send({
                "message": "Invalid username"
            });
        else
            return res.send({
                "name": account.firstname + ' ' + account.lastname,
                "balance": account.balance
            });
    }
    catch (e) {
        res.status(401).send({
            message: "Invalid token"
        });
    }
});
app.post('/deposit', express_validator_1.body('amount').isInt({ min: 1 }), express_validator_1.query('token').isString(), function (req, res) {
    var _a;
    if (!express_validator_1.validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" });
    var token = (_a = req.query) === null || _a === void 0 ? void 0 : _a.token;
    try {
        var username_2 = jsonwebtoken_1.default.verify(token, SECRET).username;
        var amount = req.body.amount;
        var account = db.find(function (x) { return x.username === username_2; });
        if (!account)
            return res.status(400).send({
                message: "Invalid username"
            });
        account.balance += amount;
        return res.send({
            message: "Deposit successfully",
            balance: account.balance
        });
    }
    catch (e) {
        res.status(401).send({
            message: "Invalid token"
        });
    }
});
app.post('/withdraw', express_validator_1.body('amount').isInt({ min: 1 }), express_validator_1.query('token').isString(), function (req, res) {
    var _a;
    if (!express_validator_1.validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" });
    var token = (_a = req.query) === null || _a === void 0 ? void 0 : _a.token;
    try {
        var username_3 = jsonwebtoken_1.default.verify(token, SECRET).username;
        var amount = req.body.amount;
        var account = db.find(function (x) { return x.username === username_3; });
        if (!account)
            return res.status(400).send({
                message: "Invalid username"
            });
        if (amount > account.balance)
            return res.status(400).json({ message: "Invalid data" });
        account.balance -= amount;
        return res.send({
            message: "Withdraw successfully",
            balance: account.balance
        });
    }
    catch (e) {
        res.status(401).send({
            message: "Invalid token"
        });
    }
});
app.post('/transferBalance', express_validator_1.body('receiverUsername').isString(), express_validator_1.body('amount').isNumeric(), express_validator_1.query('token').isString(), function (req, res) {
    var _a;
    var _b;
    if (!express_validator_1.validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" });
    var token = (_b = req.query) === null || _b === void 0 ? void 0 : _b.token;
    try {
        var username_4 = jsonwebtoken_1.default.verify(token, SECRET).username;
        var _c = req.body, receiverUsername_1 = _c.receiverUsername, amount = _c.amount;
        var sender = db.find(function (x) { return x.username === username_4; });
        var receiver = db.find(function (x) { return x.username === receiverUsername_1; });
        if (!sender || !receiver)
            return res.status(400).send({
                message: "Invalid data"
            });
        if (amount > sender.balance)
            return res.status(400).json({ message: "Invalid data" });
        sender.balance -= amount;
        receiver.balance += amount;
        return res.send({
            message: "Transfer balance successfully",
            balance: (_a = {},
                _a[sender.firstname + ' ' + sender.lastname] = sender.balance,
                _a[receiver.firstname + ' ' + receiver.lastname] = receiver.balance,
                _a)
        });
    }
    catch (e) {
        res.status(401).send({
            message: "Invalid token"
        });
    }
});
app.delete('/reset', function (req, res) {
    db.splice(0, db.length);
    return res.send({
        message: 'Reset database successfully'
    });
});
app.listen(PORT, function () { return console.log("Server is running at " + PORT); });
