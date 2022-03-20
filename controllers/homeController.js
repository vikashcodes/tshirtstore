const BigPromise = require("../midlewares/bigPromise");

exports.home = BigPromise(async (req, res) => {
	// const db = await something()
	res.status(200).json({
		success: true,
		greeting: "hello from API",
	});
});

exports.homeDummy = BigPromise((req, res) => {
	res.status(200).json({
		success: true,
		greeting: "hello from API dummy",
	});
});
