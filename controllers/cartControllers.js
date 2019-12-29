const Sequelize = require('sequelize');
const db = require('../models');
const Cart = db.Cart;
const CartItem = db.CartItem;
const Product = db.Product;
const Image = db.Image;
const Color = db.Color;

const cartController = {
  getCart: async (req, res) => {
    try {
      if (!req.session.cartId) {
        return res.json({
          status: 'error',
          message: 'No such a cart id data'
        });
      }

      const Products = await Product.findAll().then(products => products);
      let cartItems = await CartItem.findAll({
        where: { CartId: req.session.cartId }
      }).then(c => c);
      const Colors = await Color.findAll().then(colors => colors);
      const Images = await Image.findAll().then(images => images);

      cartItems = cartItems.map(cart => ({
        ...cart.dataValues,
        Product: Products.filter(i => i.dataValues).find(
          product => product.id == cart.dataValues.ProductId
        ),
        Color: Colors.filter(i => i.dataValues).find(
          color => color.id == cart.dataValues.ColorId
        ),
        Image: Images.filter(i => i.dataValues).find(
          image => image.ProductId == cart.dataValues.ProductId
        )
      }));

      let totalPrice =
        cartItems.length > 0
          ? cartItems.map(d => d.price * d.quantity).reduce((a, b) => a + b)
          : 0;

      return res.json({
        status: 'success',
        message: 'Fetch cart data successfully',
        cart: cartItems,
        totalPrice
      });
    } catch (error) {
      // TODO: UT not create any data in before function
      return res
        .status(500)
        .json({ status: 'error', message: 'Fail to fetch cart data' });
    }
  },
  postCart: async (req, res) => {
    try {
      return Cart.findOrCreate({
        where: {
          id: req.session.cartId || 0
        }
      }).spread(function(cart, created) {
        const { price, quantity, productId, colorId } = req.body;
        if (!price) {
          return res.json({ status: 'error', message: 'price is missing' });
        }
        if (!quantity) {
          return res.json({ status: 'error', message: 'quantity is missing' });
        }
        if (!productId || !colorId) {
          return res.json({
            status: 'error',
            message: 'Fail to find products'
          });
        }

        return CartItem.findOrCreate({
          where: {
            CartId: cart.id,
            ProductId: productId,
            ColorId: colorId
          },
          default: {
            CartId: cart.id,
            price,
            quantity: 0,
            ProductId: productId,
            ColorId: colorId
          }
        }).spread(function(cartItem, created) {
          return cartItem
            .update({
              quantity: (parseInt(cartItem.quantity) || 0) + 1,
              price
            })
            .then(cartItem => {
              req.session.cartId = cart.id;
              return req.session.save(err => {
                if (err) {
                  return res.send('session error' + err);
                }
                return res.json({
                  status: 'success',
                  message: 'Added to cart'
                });
              });
            });
        });
      });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Fail to add to cart' });
    }
  },
  addCartItem: async (req, res) => {
    try {
      const cart = await Cart.findByPk(req.session.cartId);
      if (!cart) {
        return res.json({
          status: 'error',
          message: 'Cannot update item not in the cart'
        });
      }

      const cartItem = await CartItem.findByPk(req.params.id);
      cartItem.update({
        quantity: cartItem.quantity + 1,
        price: cartItem.price
      });

      return res.json({
        status: 'success',
        message: 'Update cart successfully'
      });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Fail to add up cart item' });
    }
  },
  subCartItem: async (req, res) => {
    try {
      const cart = await Cart.findByPk(req.session.cartId);
      if (!cart) {
        return res.json({
          status: 'error',
          message: 'Cannot update item not in the cart'
        });
      }
      const cartItem = await CartItem.findByPk(req.params.id);
      cartItem.update({
        quantity: cartItem.quantity - 1 >= 1 ? cartItem.quantity - 1 : 1,
        price: cartItem.price
      });

      return res.json({
        status: 'success',
        message: 'Update cart successfully'
      });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Fail to subtract cart item' });
    }
  },
  deleteCartItem: async (req, res) => {
    try {
      const cart = await Cart.findByPk(req.session.cartId);
      if (!cart) {
        return res.json({
          status: 'error',
          message: 'Cannot update item not in the cart'
        });
      }
      const cartItem = await CartItem.findByPk(req.params.id);
      cartItem.destroy();
      return res.json({ status: 'success', message: 'Removed item from cart' });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Fail to remove the item from cart'
      });
    }
  }
};

module.exports = cartController;
