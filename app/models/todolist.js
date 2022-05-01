const mongoose = require('mongoose')

const toDoListSchema = new mongoose.Schema(
	{
		date: {
			type: String
		},
        tasks: {
            type: Array,
        },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			// required: true,
			unique: true
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('ToDoList', toDoListSchema)