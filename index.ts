import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

interface Account {
  username: string;
  hashedPassword: string;
  firstname: string;
  lastname: string
  balance: number
}

interface JWTPayload {
  username: string;
  password: string;
}

const db: Array<Account> = []

app.post('/login',
  body('username').isString(),
  body('password').isString(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const { username, password } = req.body
    const user = db.find(x => x.username === username)

    if (!user)
      return res.status(400).json({
        message: 'Invalid username or password'
      })

    if (!bcrypt.compareSync(password, user.hashedPassword))
      return res.status(400).json({
        message: 'Invalid username or password'
      })

    const token = jwt.sign(
      {
        username: user.username, password
      },
      SECRET
    )

    return res.json({
      message: 'Login successfully',
      token
    })

  })

app.post('/register',
  body('username').isString(),
  body('password').isString(),
  body('firstname').isString(),
  body('lastname').isString(),
  body('balance').isInt(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const { username, password, firstname, lastname, balance } = req.body
    const hashedPassword = bcrypt.hashSync(password, 10)

    //validate
    if (db.filter(x => x.username === username).length > 0) {
      res.status(400).json({
        "message": "Username is already in used"
      })
      return
    }

    const account = {
      username, hashedPassword, firstname, lastname, balance
    }

    db.push(account)
    console.log(db)
    res.json({
      message: "Register successfully"
    })
  })

app.get('/balance',
  query('token').isString(),
  (req, res) => {
    const token = req.query?.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const account = db.find(x => x.username === username)

      //validate
      if (!account)
        return res.status(400).json({
          "message": "Invalid username"
        })
      else
        return res.json({
          "name": account.firstname + ' ' + account.lastname,
          "balance": account.balance
        })
    }
    catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  query('token').isString(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })


    const token = req.query?.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const amount = req.body.amount

      const account = db.find(x => x.username === username)
      if (!account)
        return res.status(400).json({
          message: "Invalid username"
        })

      account.balance += amount
      return res.json({
        message: "Deposit successfully",
        balance: account.balance
      })
    }
    catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
    }
  })

app.post('/withdraw',
  body('amount').isInt({ min: 1 }),
  query('token').isString(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const token = req.query?.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const amount = req.body.amount

      const account = db.find(x => x.username === username)
      if (!account)
        return res.status(400).json({
          message: "Invalid username"
        })

      if (amount > account.balance)
        return res.status(400).json({ message: "Invalid data" })

      account.balance -= amount
      return res.json({
        message: "Withdraw successfully",
        balance: account.balance
      })
    }
    catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
    }
  })

app.post('/transferBalance',
  body('receiverUsername').isString(),
  body('amount').isNumeric(),
  query('token').isString(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const token = req.query?.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const { receiverUsername, amount } = req.body

      const sender = db.find(x => x.username === username)
      const receiver = db.find(x => x.username === receiverUsername)

      if (!sender || !receiver)
        return res.status(400).json({
          message: "Invalid data"
        })

      if (amount > sender.balance)
        return res.status(400).json({ message: "Invalid data" })

      sender.balance -= amount
      receiver.balance += amount
      return res.json({
        message: "Transfer balance successfully",
        balance: {
          [sender.firstname + ' ' + sender.lastname]: sender.balance,
          [receiver.firstname + ' ' + receiver.lastname]: receiver.balance
        }
      })
    } catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
    }
  })

app.delete('/reset', (req, res) => {
  db.splice(0, db.length)
  return res.json({
    message: 'Reset database successfully'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))