const express = require('express');
const router = express.Router();
const controller = require('../controllers/UserController');
router.post('/:id', controller.post);

router.get('/', controller.get);
module.exports = router;
