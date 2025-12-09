const express = require('express');
const router = express.Router();
const inquiryCtrl = require('../controllers/inquiry.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// user inquiries
router.post('/', auth, inquiryCtrl.sendInquiry);
router.get('/mine', auth, inquiryCtrl.listUserInquiries);

// admin
router.get('/', auth, role('admin'), inquiryCtrl.listAll);
router.put('/:id', auth, role('admin'), inquiryCtrl.updateStatus);

module.exports = router;
