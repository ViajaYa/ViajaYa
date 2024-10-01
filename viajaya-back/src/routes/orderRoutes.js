const express = require('express');
const router = express.Router();

const {
    createOrderReservation,
    getAllOrderReservations,
    getOrderReservationById,
    updateOrderReservation,
    deleteOrderReservation,
    getOrderReservationsByUser,
  } = require('../controllers/orderReservationControllers');

router.post('/', createOrderReservation);  // Crear una nueva orden
router.get('/', getAllOrderReservations);  // Obtener todas las órdenes
router.get('/:id', getOrderReservationById);  // Obtener una orden por ID
router.get('/user/:userId', getOrderReservationsByUser);  // Obtener todas las órdenes de un usuario
router.put('/:id', updateOrderReservation);  // Actualizar una orden
router.delete('/:id', deleteOrderReservation);  // Eliminar una orden

module.exports = router;