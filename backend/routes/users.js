const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({ message: 'users route placeholder' });
});

module.exports = router;
