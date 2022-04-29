// seed.js is going to be a script that we can run from the terminal, to create a bunch of items at once. 

// we'll need to be careful with our seed here, and when we run it, because it will remove all the items first, then add the new ones. 

const mongoose = require('mongoose')
const Item = require('./item')

const db = require('../../config/db')

const startItems = [
    { description: 'background', cost: 150, sprite: "image-url"},
    { description: 'parakeet', cost: 450, sprite: "image-url"},
    { description: 'drip', cost: 950, sprite: "image-url"},
    { description: 'couch', cost: 10, sprite: "image-url"},
    { description: 'mug', cost: 5, sprite: "mug-url"}
]

//first we connect to the db via mongoose
mongoose.connect(db, {
	useNewUrlParser: true,
})
    .then(() => {
        // then we remove all the items except the ones that have an owner
        Item.deleteMany({ owner: null })
            .then(deletedItems => {
                console.log('deleted items', deletedItems)
                // then we create using the startitems array
                // we'll use console logs to check if it's working or if there are errors
                Item.create(startItems)
                    .then(newItems => {
                        console.log('the new items', newItems)
                        mongoose.connection.close()
                    })
                    .catch(err => {
                        console.log(err)
                        mongoose.connection.close()
                    })
            })
            .catch(error => {
                console.log(error)
                mongoose.connection.close()
            })
    })
    // then at the end, we close our connection to the db
    .catch(error => {
        console.log(error)
        mongoose.connection.close()
    })
