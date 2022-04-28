const mongoose = require('mongoose')

const characterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		class: {
			type: String,
			required: true,
		},
        coins: {
            type: Number,
			default: 0
        },
        sprite: {
            type: String,
        },
        ownedItems: {
            type: Array
        },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Character', characterSchema)