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
            required: true,
        },
        sprite: {
            type: String,
            required: true
        },
        ownedItems: {
            type: Array
        },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Character', characterSchema)