const express = require("express");
const { createOrder, getOneOrder, getLooggedInOrders, admingetAllOrders, adminUpdateOrder, adminDeleteOrder } = require("../controllers/orderController");
const router = express.Router();
const { isLoggedIn, customRole } = require("../midlewares/user");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOneOrder);
router.route("/myorder").get(isLoggedIn, getLooggedInOrders);

// admin routes
router.route("/admin/order").get(isLoggedIn, customRole("admin"), admingetAllOrders).put(isLoggedIn, customRole("admin"), adminUpdateOrder).delete(isLoggedIn, customRole("admin"), adminDeleteOrder);
router.route("/admin/order/:id").put(isLoggedIn, customRole("admin"), adminUpdateOrder).delete(isLoggedIn, customRole("admin"), adminDeleteOrder);

module.exports = router;
