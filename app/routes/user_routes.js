const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10

// pull in error types and the logic to handle them and set status codes
const errors = require('../../lib/custom_errors')

const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError

const User = require('../models/user')
const Character = require('../models/character')
const Store = require('../models/store')
const ToDoList = require('../models/todolist')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })
//we need to make a character and user at the same time
// instantiate a router (mini app that only handles routes)
const router = express.Router()

///////////////////////////
// CREATE -> POST SIGN-UP //
///////////////////////////
router.post('/sign-up', (req, res, next) => {
	// start a promise chain, so that any errors will pass to `handle`
	const startStore = 
{
    inventory: [
            {
            item: { 
                description: 'parakeet', 
                cost: 450, 
                sprite: "image-url",
				bought: false
                } 
            },
            {
            item: { 
                description: 'drip', 
                cost: 950, 
                sprite: "image-url",
				bought: false
			}
            },
            {
            item: { 
                description: 'mug', 
                cost: 5, 
                sprite: "image-url",
				bought: false
			}
            }
        ]
}
	const newUser = Promise.resolve(req.body.credentials)
		// reject any requests where `credentials.password` is not present, or where
		// the password is an empty string
		.then((credentials) => {
			if (
				!credentials ||
				!credentials.password ||
				credentials.password !== credentials.password_confirmation
			) {
				throw new BadParamsError()
			}
		})
		// generate a hash from the provided password, returning a promise
		.then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
		.then((hash) => {
			// return necessary params to create a user
			return {
				email: req.body.credentials.email,
				hashedPassword: hash,
			}
		})
		// create user with provided email and hashed password
		.then((user) => User.create(user))
		// send the new user object back with status 201, but `hashedPassword`
		.then( user => {
			return user
		})
		// won't be send because of the `transform` in the User model
		// pass any errors along to the error handler
		.catch(next)
	//creates the character on signup
	const newCharacter = Character.create(req.body.character)
		.then( character => {
			return character
		})
		.catch(next)
	//creates the store on signup
	const newStore = Store.create(startStore)
		.then(store => {
			return store
		})
		.catch(next)
	//creates the todolist on signup
	const newTodo = ToDoList.create(req.body.todo)
		.then(todo => {
			return todo
		})
		.catch(next)

		// if an error occurs, pass it to the error handler

		Promise.all([newUser, newCharacter, newStore, newTodo])
			//the promise chain assings the user, character, store and todolist to the owners ._id
			.then(responseData => {
				//the first index of response data returns the user 
				const user = responseData[0]
				//the second index of response data returns the character
				const emptyCharacter = responseData[1]
				//the third index of response data returns the store
				const emptyStore = responseData[2]
				//the fourth index of response data returns the todolist
				const emptyTodo = responseData[3]
				//assigning the character to the users id
				emptyCharacter.owner = user._id
				//assigning the store to the users id
				emptyStore.owner= user._id
				//assigning the todolist to the users id
				emptyTodo.owner= user._id
				//sets the player character key to the character object
				user.playerCharacter = emptyCharacter
				//sets the player store key to the store object
				user.playerStore = emptyStore
				//sets the player todolist key to the todolist object
				user.playerTodo = emptyTodo
				console.log('response data - user', user)
				console.log('response data - emptyCharacter', emptyCharacter)
				console.log('response data - emptyStore', emptyStore)
				console.log('response data - emptyTodo', emptyTodo)
				//saves the created keys to the user model
				return emptyCharacter.save() && emptyStore.save() && emptyTodo.save() && user.save()
			})
			.then((responseData) => res.status(201).json({ responseData: responseData.toObject() }))
			.catch(next)
})

///////////////////////////
// CREATE -> POST SIGN IN //
///////////////////////////
router.post('/sign-in', (req, res, next) => {
	const pw = req.body.credentials.password
	let user

	// find a user based on the email that was passed
	User.findOne({ email: req.body.credentials.email })
		//fills in the playercharacter object on sign in
		.populate('playerCharacter')
		//fills in the playerstore object on sign in
		.populate('playerStore')
		//fills in the playertodo object on sign in
		.populate('playerTodo')
		.then((record) => {
			// if we didn't find a user with that email, send 401
			if (!record) {
				throw new BadCredentialsError()
			}
			// save the found user outside the promise chain
			user = record
			// `bcrypt.compare` will return true if the result of hashing `pw`
			// is exactly equal to the hashed password stored in the DB
			return bcrypt.compare(pw, user.hashedPassword)
		})
		.then((correctPassword) => {
			// if the passwords matched
			if (correctPassword) {
				// the token will be a 16 byte random hex string
				const token = crypto.randomBytes(16).toString('hex')
				user.token = token
				console.log('this is the user', user)
				// save the token to the DB as a property on user
				return user.save()
			} else {
				// throw an error to trigger the error handler and end the promise chain
				// this will send back 401 and a message about sending wrong parameters
				throw new BadCredentialsError()
			}
		})
		.then((user) => {
			// return status 201, the email, and the new token
			res.status(201).json({ user: user.toObject() })
		})
		.catch(next)
})

/////////////////////////////////////
// UPDATE -> PATCH  CHANGE PASSWORD //
/////////////////////////////////////
router.patch('/change-password', requireToken, (req, res, next) => {
	let user
	// `req.user` will be determined by decoding the token payload
	User.findById(req.user.id)
		// save user outside the promise chain
		.then((record) => {
			user = record
		})
		// check that the old password is correct
		.then(() => bcrypt.compare(req.body.passwords.old, user.hashedPassword))
		// `correctPassword` will be true if hashing the old password ends up the
		// same as `user.hashedPassword`
		.then((correctPassword) => {
			// throw an error if the new password is missing, an empty string,
			// or the old password was wrong
			if (!req.body.passwords.new || !correctPassword) {
				throw new BadParamsError()
			}
		})
		// hash the new password
		.then(() => bcrypt.hash(req.body.passwords.new, bcryptSaltRounds))
		.then((hash) => {
			// set and save the new hashed password in the DB
			user.hashedPassword = hash
			return user.save()
		})
		// respond with no content and status 200
		.then(() => res.sendStatus(204))
		// pass any errors along to the error handler
		.catch(next)
})

/////////////////////////////////
// DELETE -> DESTROY /SIGN-OUT //
/////////////////////////////////
router.delete('/sign-out', requireToken, (req, res, next) => {
	// create a new random token for the user, invalidating the current one
	req.user.token = crypto.randomBytes(16)
	// save the token and respond with 204
	req.user
		.save()
		.then(() => res.sendStatus(204))
		.catch(next)
})

module.exports = router
