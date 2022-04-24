// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for items
const Item = require('../models/item')

const ToDoList = require('../models/todolist')
// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { item: { title: '', text: 'foo' } } -> { item: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET 
router.get('/todo', requireToken, (req, res, next) => {
	ToDoList.find()
		.then((todolists) => {
			// `todolists` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return todolists.map((example) => example.toObject())
		})
		// respond with status 200 and JSON of the todolists
		.then((todolists) => res.status(200).json({ todolists: todolists }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// // SHOW
// // GET /examples/5a7db6c74d55bc51bdf39793
// router.get('/examples/:id', requireToken, (req, res, next) => {
// 	// req.params.id will be set based on the `:id` in the route
// 	Example.findById(req.params.id)
// 		.then(handle404)
// 		// if `findById` is succesful, respond with 200 and "example" JSON
// 		.then((example) => res.status(200).json({ example: example.toObject() }))
// 		// if an error occurs, pass it to the handler
// 		.catch(next)
// })

// CREATE
// POST 
router.post('/todo', requireToken, (req, res, next) => {
    // set up date method here --> (this is to set up a to do list time that will reset daily to our seeded data that is an empty list so that you will have a clear list everyday)

	ToDoList.create()
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((example) => {
			res.status(201).json({ example: example.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

module.exports = router

