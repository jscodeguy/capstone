// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// pull in Mongoose model for tasks
const Task = require('../models/task')
// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')
// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership


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
// INDEX -> GET /tasks //
/////////////////////////
router.get('/task', requireToken, (req, res, next) => {
	Task.find()
		.then((tasks) => {
			// `tasks` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return tasks.map((task) => task.toObject())
		})
		// respond with status 200 and JSON of the tasks
		.then((tasks) => res.status(200).json({ tasks: tasks }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

////////////////////////////
// SHOW -> GET /tasks/:id //
////////////////////////////
router.get('/task/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	const taskId = req.params.id
	Task.findById(taskId)
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "task" JSON
		.then((task) => res.status(200).json({ task: task.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// CREATE
// POST /tasks
router.post('/task', requireToken, (req, res, next) => {
	console.log('this is req.body', req.body)
	req.body.task.owner = req.user.id
	Task.create(req.body.task)
	// respond to succesful `create` with status 201 and JSON of new "task"
	.then((task) => {
			
			res.status(201).json({ task: task.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

// UPDATE
// PATCH /tasks/5a7db6c74d55bc51bdf39793
router.patch('/task/:id/edit', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.task.owner

	Task.findById(req.params.id)
		.then(handle404)
		.then((task) => {
			console.log('this is task in task_routes PATCH', task)
			console.log('this is incoming task in task_routes PATCH', req.body.task)
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, task)

			// pass the result of Mongoose's `.update` to the next `.then`
			return task.updateOne(req.body.task)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /tasks/5a7db6c74d55bc51bdf39793
router.delete('/task/:id', requireToken, (req, res, next) => {
	Task.findById(req.params.id)
		.then(handle404)
		.then((task) => {
			// throw an error if current user doesn't own `task`
			requireOwnership(req, task)
			// delete the task ONLY IF the above didn't throw
			task.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router