const router = require('express').Router();
const ctrl = require('../controllers/redirect.controller');

router.get('/:slug', ctrl.redirect);

module.exports = router;