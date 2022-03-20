const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Provide provide a name"],
		maxlength: [40, "Name should be under 40 characters"],
	},
	email: {
		type: String,
		required: [true, "Provide provide a email"],
		validate: [validator.isEmail, "Please enter email in correct format"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "Provide provide a password"],
		minlength: [6, "password should be atleast 6 char"],
		select: false,
	},
	role: {
		type: String,
		default: "user",
	},
	photo: {
		id: {
			type: String,
			required: true,
		},
		secure_url: {
			type: String,
			required: true,
		},
	},
	forgotPasswordToken: String,
	forgotPasswordToken: Date,
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// encrypt password before save
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next;
	}
	this.password = await bcrypt.hash(this.password, 10);
});

//validate the password with passed on user password
userSchema.methods.isValidatedPassword = async function (usersendPassword) {
	return await bcrypt.compare(usersendPassword, this.password);
};

//create and return jwt token
userSchema.methods.getJwtToken = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRY,
	});
};

// generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = async function () {
	// generate a long and random string
	const forgotToken = crypto.randomBytes(20).toString("hex");

	// getting a hash - make sure to get a hash on backend code
	this.forgotPasswordToken = crypto.createHash("sha256").update(forgotToken).digest("hex");

	// time for token
	this.forgotPasswordExpiry = Date.now() + process.env.FORGOT_PASSWORD_EXPIRY_TIME;

	return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
