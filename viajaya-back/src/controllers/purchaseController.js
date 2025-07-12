const { Purchase, ContractItems } = require('../db');

// Crear una compra para un item
const createPurchase = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      proveedor,
      costo,
      fecha_compra,
      fecha_vencimiento_pago,
      comprobante_url,
      estado_pago,
      observaciones
    } = req.body;

    // Verifica que el item existe
    const item = await ContractItems.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });

    const purchase = await Purchase.create({
      contract_item_id: itemId,
      proveedor,
      costo,
      fecha_compra,
      fecha_vencimiento_pago,
      comprobante_url,
      estado_pago,
      observaciones
    });

    res.status(201).json({ message: 'Compra creada', purchase });
  } catch (error) {
    res.status(500).json({ message: 'Error creando compra', error: error.message });
  }
};

// Listar compras de un item
const getPurchasesByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const purchases = await Purchase.findAll({ where: { contract_item_id: itemId } });
    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo compras', error: error.message });
  }
};

// Actualizar una compra
const updatePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) return res.status(404).json({ message: 'Compra no encontrada' });

    await purchase.update(req.body);
    res.json({ message: 'Compra actualizada', purchase });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando compra', error: error.message });
  }
};

// Eliminar una compra
const deletePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) return res.status(404).json({ message: 'Compra no encontrada' });

    await purchase.destroy();
    res.json({ message: 'Compra eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando compra', error: error.message });
  }
};

module.exports = {
  createPurchase,
  getPurchasesByItem,
  updatePurchase,
  deletePurchase
};