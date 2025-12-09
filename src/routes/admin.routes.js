const express = require('express');
const router = express.Router();

const adminCtrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Dashboard stats
router.get('/stats', auth, role('admin'), adminCtrl.getStats);

// User management
router.get('/users', auth, role('admin'), adminCtrl.listUsers);
router.put('/users/:id/block', auth, role('admin'), adminCtrl.blockUser);
router.put('/users/:id/unblock', auth, role('admin'), adminCtrl.unblockUser);

// Sold car records
router.post('/sold', auth, role('admin'), adminCtrl.addSold);
router.get('/sold', auth, role('admin'), adminCtrl.listSold);

module.exports = router;
