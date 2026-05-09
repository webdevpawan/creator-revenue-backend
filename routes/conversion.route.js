const router = require('express').Router();
const ctrl = require('../controllers/conversion.controller');
const auth = require('../middlewares/tokenVerify');
const upload = require('../middlewares/upload');


router.post('/', auth, ctrl.addConversion);

router.get('/', auth, ctrl.getConversions);

router.post('/import',auth, upload.single('file'),ctrl.importConversions);

module.exports = router;