const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const upload = require("../middleware/upload");

// GET ALL
router.get("/", productController.getAll);

// ADD PRODUCT + UPLOAD (FIELD HARUS "image")
router.post("/", upload.single("image"), productController.create);

// UPDATE PRODUCT + UPLOAD
router.put("/:id", upload.single("image"), productController.update);

// DELETE
router.delete("/:id", productController.remove);

module.exports = router;
