const {Router} = require("express")
const {getAllNumbers, selectNumbers, getAvailableNumbers, getSelectedNumbers, updateNumberPaymentStatus, resetNumbers} = require("../controllers/numberControllers")

const router = Router();

router.get('/numbers', getAllNumbers);
router.post('/numbers/select', selectNumbers);
router.get('/numbers/available', getAvailableNumbers);
router.get('/numbers/selected', getSelectedNumbers);
router.put('/numbers/:id/pay', updateNumberPaymentStatus);
router.post('/numbers/reset', resetNumbers);

module.exports = router




