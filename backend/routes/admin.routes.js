const router = require("express").Router();
const admin = require("../controllers/admin.controller");

router.post("/login", admin.login);

module.exports = router;
