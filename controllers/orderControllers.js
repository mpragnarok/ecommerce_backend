const Sequelize = require('sequelize');
const db = require('../models');
const helpers = require('../_helpers');
const Cart = db.Cart;
const Product = db.Product;
const CartItem = db.CartItem;
const User = db.User;
const Inventory = db.Inventory;
const Order = db.Order;
const OrderItem = db.OrderItem;
const Op = Sequelize.Op;

const orderController = {
  createOrder: (req, res) => {
    const { CartId, UserId } = req.body;

    if (helpers.getUser(req).id !== Number(UserId)) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Can not find any user data' });
    }

    if (!CartId || !UserId) {
      return res
        .status(400)
        .json({ status: 'error', message: "required field didn't exist" });
    }

    return Cart.findByPk(CartId, {
      include: CartItem
    }).then(async cart => {
      const UserInfo = await User.findByPk(UserId).then(user => user);
      const tempCartItems = cart.CartItems;
      let id;
      let temp = {};
      return Order.create({
        order_status: '訂單處理中',
        shipping_status: '未出貨',
        payment_status: '未付款',
        name: UserInfo.name,
        address: UserInfo.address,
        email: UserInfo.email,
        phone: UserInfo.tel,
        UserId: UserInfo.id
      }).then(order => {
        for (let i = 0; i < tempCartItems.length; i++) {
          Inventory.findOne({
            where: {
              ProductId: tempCartItems[i].ProductId,
              ColorId: tempCartItems[i].ColorId
            }
          }).then(async inventory => {
            if (inventory.quantity > tempCartItems[i].quantity) {
              await OrderItem.create({
                price: tempCartItems[i].price,
                quantity: tempCartItems[i].quantity,
                OrderId: order.id,
                ProductId: tempCartItems[i].ProductId,
                ColorId: tempCartItems[i].ColorId
              });
              await CartItem.destroy({
                where: {
                  CartId,
                  ProductId: tempCartItems[i].ProductId,
                  ColorId: tempCartItems[i].ColorId
                }
              });
              await order.update({
                total_amount: order.total_amount
                  ? order.total_amount +
                    tempCartItems[i].price * tempCartItems[i].quantity
                  : tempCartItems[i].price * tempCartItems[i].quantity
              });
              const newQuantity =
                inventory.quantity - tempCartItems[i].quantity;
              await inventory.update({
                quantity: newQuantity
              });
            } else {
              temp['nonCreate'] = true;
            }
          });
        }
        setTimeout(() => {
          if (temp.nonCreate || tempCartItems.length === 0) {
            Order.destroy({ where: { id: order.id } });
            return res
              .status(200)
              .json({ status: 'error', message: 'Create order fail' });
          }
          return res
            .status(200)
            .json({ status: 'success', message: 'Create order success' });
        }, 100);
      });
    });
  },

  getOrder: (req, res) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Can not find any user data' });
    }

    return Order.findAll({
      include: [{ model: Product, as: 'items' }],
      where: {
        UserId: req.params.id,
        payment_status: '未付款'
      }
    }).then(orders => {
      if (orders && orders.length > 0) {
        return res.status(200).json({ status: 'success', orders });
      }
      return res
        .status(200)
        .json({ status: 'success', message: 'Nothing in your order list' });
    });
  }
};

module.exports = orderController;
