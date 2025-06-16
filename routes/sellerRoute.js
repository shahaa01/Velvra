const express = require('express');
const router = express.Router();
// const Seller = require('../models/seller');


router.route('/')
    .get(async(req, res) => {
        res.render('page/seller');
    })

module.exports = router