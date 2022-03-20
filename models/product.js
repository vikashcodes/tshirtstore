const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please provide product name"],
		trim: true,
		maxlength: [120, "Product name should not be more than 120 characters"],
	},
	price: {
		type: Number,
		required: [true, "Please provide product price"],
		maxlength: [6, "Product name should not be more than 5 digits"],
	},
	description: {
		type: String,
		required: [true, "Please provide product description"],
	},
	photos: [
		{
			id: {
				type: String,
				required: true,
			},
			secure_url: {
				type: String,
				required: true,
			},
		},
	],
	category: {
		type: String,
		required: [true, "Please select category from- short-sleeves, long-slevees, sweat-shirts, hoodies"],
		enum: {
			values: ["shortsleeves", "longsleeves", "sweatshirt", "hoodies"],
			message: "please select category from- short-sleeves, long-slevees, sweat-shirts, hoodies",
		},
	},
	// this field was updated in order videos later
	stock: {
		type: Number,
		required: [true, "please add a number in stock"],
	},
	brand: {
		type: String,
		required: [true, "please add a brand for clothing"],
	},
	brand: {
		type: String,
		default: 0,
	},
	numberOfReviews: {
		type: Number,
		default: 0,
	},
	reviews: [
		{
			user: {
				type: mongoose.Schema.ObjectId,
				ref: "User",
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			rating: {
				type: Number,
				required: true,
			},
			comment: {
				type: String,
				required: true,
			},
		},
	],
	user: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Product", productSchema);
