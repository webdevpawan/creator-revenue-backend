const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middlewares/tokenVerify');


router.get('/', auth, ctrl.getDashboard);

module.exports = router;