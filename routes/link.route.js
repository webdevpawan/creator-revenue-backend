const router = require('express').Router();
const ctrl = require('../controllers/link.controller');
const auth = require('../middlewares/tokenVerify');

router.post('/', auth, ctrl.createLink);
router.get('/', auth, ctrl.getLinks);

module.exports = router;