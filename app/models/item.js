const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema(
	{
		description: {
			type: String,
			required: true,
		},
		cost: {
			type: Number,
			required: true,
		},
		sprite: {
			type: String,
			required: true,
		},
        owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
	    },
    },
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Item', ItemSchema)