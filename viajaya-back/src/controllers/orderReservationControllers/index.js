const createOrderReservation = require('./createOrderReservation');
const getAllOrderReservations = require('./getAllOrderReservations');
const getOrderReservationById = require('./getOrderReservationById');
const updateOrderReservation = require('./updateOrderReservation');
const deleteOrderReservation = require('./deleteOrderReservation');
const getOrderReservationsByUser = require('./getOrderReservationsByUser');

module.exports = {
  createOrderReservation,
  getAllOrderReservations,
  getOrderReservationById,
  updateOrderReservation,
  deleteOrderReservation,
  getOrderReservationsByUser,
};
