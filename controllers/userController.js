const User = require("../models/user");
const BigPromise = require("../midlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary").v2;
const cookieToken = require("../utils/cookietoken");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
	// let result;

	if (!req.files) {
		return next(new CustomError("photo is required for signup", 400));
	}

	const { name, email, password } = req.body;

	if (!email || !name || !password) {
		// this is for custom error classes defined in utils
		// return next(new CustomError("Please send email", 400));

		return next(new Error("Name, email and password are required"));
	}

	let file = req.files.photo;

	const result = await cloudinary.uploader.upload(file.tempFilePath, {
		folder: "users",
		width: 150,
		crop: "scale",
	});

	const user = await User.create({
		name,
		email,
		password,
		photo: {
			id: result.public_id,
			secure_url: result.secure_url,
		},
	});

	cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
	const { email, password } = req.body;

	// check for presence of email and password
	if (!email || !password) {
		return next(new CustomError("please provide email and password", 404));
	}

	// get user from db
	const user = await User.findOne({ email }).select("+password");

	// checking if user is not found inn db
	if (!user) {
		return next(new CustomError("you are not a registered user in our database", 400));
	}

	// match the password
	const isPasswordCorrect = await user.isValidatedPassword(password);
	console.log(isPasswordCorrect);
	// if password does not match
	if (!isPasswordCorrect) {
		return next(new CustomError("Email or password does not match", 400));
	}

	// if all goes good sending the token
	cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
	res.cookie("token", null, {
		expires: new Date(Date.now()),
		httpOnly: true,
	});
	res.status(200).json({
		success: true,
		message: "Logout success",
	});
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });

	if (!user) {
		return next(new CustomError("Email not found as registered", 400));
	}

	const forgotToken = await user.getForgotPasswordToken();

	await user.save({ validateBeforeSave: false });

	const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

	const message = `copy paste this link in your url and hit enter \n \n ${myUrl}`;

	try {
		await mailHelper({
			email: user.email,
			subject: "LCO TStore - Password Reset Email",
			message,
		});
		res.status(200).json({
			success: true,
			message: "Email sent successfully",
			token: forgotToken,
			url: myUrl,
			message: message,
		});
	} catch (error) {
		user.getForgotPasswordToken = undefined;
		user.forgotPasswordExpiry = undefined;
		await user.save({ validateBeforeSave: false });

		return next(new CustomError(error.message, 500));
	}
});

exports.passwordReset = BigPromise(async (req, res, next) => {
	const token = req.params.token;

	const encryToken = crypto.createHash("sha256").update(token).digest("hex");

	const user = await User.findOne({
		encryToken,
		forgotPasswordExpiry: { $gt: Date.now() },
	});

	if (!user) {
		return next(new CustomError("Token is invalid or Expired", 400));
	}

	if (req.body.password !== req.body.confirmPassword) {
		return next(new CustomError("Password and confirm password do not match", 400));
	}

	user.password = req.body.password;

	user.forgotPasswordToken = undefined;
	user.forgotPasswordExpiry = undefined;

	await user.save();

	// send a json response or send token
	cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
	const user = await User.findById(req.user.id);

	res.status(200).json({
		success: true,
		user,
	});
});

exports.changePassword = BigPromise(async (req, res, next) => {
	const userId = req.user.id;

	const user = await User.findById(userId).select("+password");

	const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword);

	if (!isCorrectOldPassword) {
		return next(new CustomError("old password is correct", 400));
	}

	user.password = req.body.password;

	await user.save();

	cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
	if (!(req.body.email && req.body.name)) {
		return next(new CustomError("Email and name are required to update", 404));
	}

	const newData = {
		name: req.body.name,
		email: req.body.email,
	};

	if (req.files) {
		const user = await User.findById(req.user.Id);

		const ImageId = user.photo.id;

		// delete photo from cloudinary
		const response = await cloudinary.v2.uploader.destroy(ImageId);

		const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
			folder: "users",
			width: 150,
			crop: "scale",
		});

		newData.photo = {
			id: result.public_id,
			secure_url: result.secure_url,
		};
	}

	const user = await User.findByIdAndUpdate(req.user.id, newData, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({
		success: true,
	});
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
	const users = await User.find({});

	res.status(200).json({
		success: true,
		users,
	});
});

exports.admingetOneUser = BigPromise(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new CustomError("No user found", 400));
	}

	res.status(200).json({
		success: true,
		user,
	});
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
	if (!(req.body.email && req.body.name)) {
		return next(new CustomError("Email and name are required to update", 404));
	}

	const newData = {
		name: req.body.name,
		email: req.body.email,
		role: req.body.role,
	};

	const user = await User.findByIdAndUpdate(req.params.id, newData, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({
		success: true,
	});
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new CustomError("no such user found", 401));
	}

	const imageId = user.photo.id;

	await cloudinary.v2.uploader.destroy(imageId);

	await user.remove();

	res.status(200).json({
		success: true,
	});
});

exports.managerAllUser = BigPromise(async (req, res, next) => {
	const users = await User.find({ role: "user" });

	res.status(200).json({
		success: true,
		users,
	});
});
