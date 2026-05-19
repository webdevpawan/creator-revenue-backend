const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.post("/google", ctrl.googleLogin);


module.exports = router;