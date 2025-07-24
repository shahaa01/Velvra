const express = require('express');
const router = express.Router();
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

router.route('/')
    .get(asyncWrap(async (req, res) => {
        res.render('../views/page/index.ejs', {
            title: 'Home'
        });
    }));

module.exports = router;