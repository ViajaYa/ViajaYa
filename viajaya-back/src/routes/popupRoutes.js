const {Router} = require("express")
const popupController = require('../controllers/popupController')

const popupRoutes = Router()

popupRoutes.get('/', popupController.getPopup);

popupRoutes.put('/:id', popupController.putPopup);

popupRoutes.post('/', popupController.postPopup);

module.exports = popupRoutes;