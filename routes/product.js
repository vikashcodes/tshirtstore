const express = require("express");
const router = express.Router();

const { getAllProduct, addProduct, adminGetAllProducts, getOneProduct, adminUpdateOneProduct, adminDeleteOneProduct, addReview, deleteReview, getOnlyReviewsForOneProduct } = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../midlewares/user");

//user routes

router.route("/products").get(getAllProduct);
router.route("/products/:id").get(getOneProduct);
router.route("/review").put(isLoggedIn, addReview);
router.route("/review").delete(isLoggedIn, deleteReview);
router.route("/review").get(isLoggedIn, getOnlyReviewsForOneProduct);

// admin routes
router.route("/admin/product/add").post(isLoggedIn, customRole("admin"), addProduct);
router.route("/admin/products").post(isLoggedIn, customRole("admin"), adminGetAllProducts);
router.route("/admin/products/:id").put(isLoggedIn, customRole("admin"), adminUpdateOneProduct).delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
