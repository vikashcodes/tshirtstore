const Product = require("../models/product");
const BigPromise = require("../midlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary").v2;
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
	// images

	let imagesArray = [];

	if (!req.files) {
		return next(new CustomError("Images are required", 401));
	}

	if (req.files) {
		for (let index = 0; index < req.files.photos.length; index++) {
			result = await cloudinary.uploader.upload(req.files.photos[index].tempFilePath, {
				folder: "products",
			});

			imagesArray.push({
				id: result.public_id,
				secure_url: result.secure_url,
			});
		}
	}

	req.body.photos = imagesArray;
	req.body.user = req.user.id;

	const product = await Product.create(req.body);

	res.status(200).json({
		success: true,
		product,
	});
});

exports.getAllProduct = BigPromise(async (req, res, next) => {
	const resultPerPage = 6;

	// to count all the products
	const totalcountProduct = await Product.countDocuments();

	const productsObj = new WhereClause(Product.find(), req.query).search().filter();

	let products = await productsObj.base;
	const filteredProductNumber = products.length;

	// agr easy krna hai to
	// products.limit().skip()

	productsObj.pager(resultPerPage);
	products = await productsObj.base.clone();

	res.status(200).json({
		success: true,
		products,
		filteredProductNumber,
		totalcountProduct,
	});
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return next(new CustomError("No product found with this id", 401));
	}

	res.status(200).json({
		success: true,
		product,
	});
});

exports.addReview = BigPromise(async (req, res, next) => {
	const { rating, comment, productId } = req.body;

	const reviews = {
		user: req.user._id,
		name: req.user.name,
		rating: Number(rating),
		comment,
	};

	const product = await Product.findById(productId);

	const AlreadyReview = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());

	if (AlreadyReview) {
		product.reviews.forEach((review) => {
			if (review.user.toString() === req.user._id.toString()) {
				review.comment = comment;
				review.rating = rating;
			}
		});
	} else {
		product.reviews.push(review);
		product.numberOfReviews = product.reviews.length;
	}

	// adjust ratings

	product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.review.length;

	await product.save({
		validateBeforeSave: true,
	});

	res.status(200).json({
		success: true,
	});
});

exports.deleteReview = BigPromise(async (req, res, next) => {
	const { productId } = req.query.productId;

	const product = await Product.findById(productId);

	const reviews = product.reviews.filter((rev) => rev.user.toString() === req.user._id.toString());

	const numberOfReviews = reviews.length;
	// adjust ratings

	product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.review.length;

	// update the product

	await product.findByIdAndUpdate(
		productId,
		{
			reviews,
			ratings,
			numberOfReviews,
		},
		{
			new: true,
			runValidators: true,
			useFindAndModify: false,
		},
	);

	res.status(200).json({
		success: true,
	});
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
	const product = await Product.findById(req.query.id);

	res.status(200).json({
		success: true,
		reviews: product.reviews,
	});
});

// admin controllers

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
	const products = await Product.find({});

	res.status(200).json({
		success: true,
		products,
	});
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
	let product = await Product.findById(req.params.id);

	if (!product) {
		return next(new CustomError("No product found with this id", 401));
	}

	imagesArray = [];

	if (req.files) {
		// destroy the existing images
		for (let index = 0; index < product.photos.length; index++) {
			const res = await cloudinary.uploader.destroy(product.photos[index].id);
		}

		// upload and save the images

		for (let index = 0; index < req.files.photos.length; index++) {
			result = await cloudinary.uploader.upload(req.files.photos[index].tempFilePath, {
				folder: "products", // folder name -> .env
			});

			imagesArray.push({
				id: result.public_id,
				secure_url: result.secure_url,
			});
		}
	}

	req.body.photos = imagesArray;

	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
		product,
	});
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return next(new CustomError("No product found with this id", 401));
	}

	// destroy the existing images
	for (let index = 0; index < product.photos.length; index++) {
		await cloudinary.uploader.destroy(product.photos[index].id);
	}

	await product.remove();

	res.status(200).json({
		success: true,
		message: "Product was deleted !",
	});
});
