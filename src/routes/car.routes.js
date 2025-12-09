const express = require('express');
const router = express.Router();

const carCtrl = require('../controllers/car.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const upload = require('../middlewares/multer.middleware');

// Public routes
router.get('/', carCtrl.listCars);
router.get('/:id', carCtrl.getCar);

// Admin routes
router.post(
  '/',
  auth,
  role('admin'),
  upload.carImages.array('images', 10),
  carCtrl.addCar
);

router.put(
  '/:id',
  auth,
  role('admin'),
  upload.carImages.array('images', 10),
  carCtrl.updateCar
);

router.delete('/:id', auth, role('admin'), carCtrl.deleteCar);

module.exports = router;
