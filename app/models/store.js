const mongoose = require('mongoose')

const storeSchema = new mongoose.Schema(
	{
        inventory: {
            type: Array
        },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			unique: true
			// required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Store', storeSchema)