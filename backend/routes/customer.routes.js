const express = require("express");
const router = express.Router();
const controller = require("../controllers/customer.controller");

// =======================
// AUTH CUSTOMER (login + register)
// =======================
router.post("/login", controller.customerLogin);
router.post("/register", controller.registerCustomer);

// =======================
// CRUD CUSTOMER untuk Admin Dashboard
// =======================

// GET semua customer
router.get("/", controller.getAllCustomers);

// GET customer by ID
router.get("/:id", controller.getCustomerById);

// ADD customer
router.post("/", controller.addCustomer);

// UPDATE customer
router.put("/:id", controller.updateCustomer);

// DELETE customer
router.delete("/:id", controller.deleteCustomer);

module.exports = router;
