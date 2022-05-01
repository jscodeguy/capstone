const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		hashedPassword: {
			type: String,
			required: true,
		},
		playerCharacter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Character',
		},
		playerStore: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Store',
		},
		playerTodo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ToDoList',
		},
		token: String,
	},
	{
		timestamps: true,
		toObject: {
			// remove `hashedPassword` field when we call `.toObject`
			transform: (_doc, user) => {
				delete user.hashedPassword
				return user
			},
		},
	}
)

module.exports = mongoose.model('User', userSchema)
