// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// pull in Mongoose model for store
const Store = require('../models/store')
// this is a collection of methods that help us detect situations when we need to throw a custom error
const customErrors = require('../../lib/custom_errors')
// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource that's owned by someone else
const requireOwnership = customErrors.requireOwnership
// this is middleware that will remove blank fields from `req.body`, e.g.
// { store: { title: '', text: 'foo' } } -> { store: { text: 'foo' } }

////////////////
// MIDDLEWARE //
////////////////
const removeBlanks = require('../../lib/remove_blank_fields')
const { Timestamp } = require('mongodb')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })
// instantiate a router (mini app that only handles routes)
const router = express.Router()

/////////////////////////
// INDEX -> GET /stores //
/////////////////////////
router.get('/store', requireToken, (req, res, next) => {
	Store.find()
		.then((stores) => {
			// `characters` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return stores.map((store) => store.toObject())
		})
		// respond with status 200 and JSON of the characters
		.then((stores) => res.status(200).json({ stores: stores }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

////////////////////
// GET /stores/:id //
////////////////////
router.get('/store/view', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Store.find()
		//pass through the error handler if 404 no content is returned
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "store" JSON
		.then((store) => res.status(200).json({ store: store.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

///////////////////////////
// CREATE -> POST /stores //
///////////////////////////
router.post('/store', requireToken, (req, res, next) => {
	Store.create(req.body.store)
		// respond to succesful `create` with status 201 and JSON of new "store"
		.then((store) => {
			res.status(201).json({ store: store.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

/////////////////////////////////////
// UPDATE -> PATCH /stores/:id/edit //
/////////////////////////////////////
router.patch('/store/:id/edit', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.store.owner
	Store.findById(req.params.id)
		//pass through the error handler if 404 no content is returned
		.then(handle404)
		.then((store) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			// requireOwnership(req, store)
			requireOwnership(req, store)

			// pass the result of Mongoose's `.update` to the next `.then`
			return store.updateOne(req.data.store)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router