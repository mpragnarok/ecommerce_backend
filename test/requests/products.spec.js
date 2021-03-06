process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../index');
const should = chai.should();
const expect = chai.expect;
const db = require('../../models');
const Cache = require('../../util/cache');
const cache = new Cache();

describe('# Product request', () => {
  context('# Home Request', () => {
    describe('When Visit HomePage', () => {
      before(async () => {
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000
        });
        await db.Image.create({ url: 'test1.jpg', ProductId: 1 });
        await db.Image.create({ url: 'test2.jpg', ProductId: 2 });
        await cache.del('getHomePageProducts');
      });

      it('should return 200 and get json data from RDBMS', done => {
        request(app)
          .get('/api/furnitures')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('success');
            expect(res.body.message).to.equal('success1');
            expect(res.body.products[0].name).to.equal('Product2 Test');
            done();
          });
      });

      it('should return 200 and get json data from cache', done => {
        request(app)
          .get('/api/furnitures')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('success');
            expect(res.body.message).to.equal(undefined);
            expect(res.body.products[0].name).to.equal('Product2 Test');
            done();
          });
      });

      after(async () => {
        await db.Product.destroy({ where: {}, truncate: true });
        await db.Image.destroy({ where: {}, truncate: true });
        await cache.del('getHomePageProducts');
      });
    });

    describe('When Visit HomePage with Image data', () => {
      before(async () => {
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000
        });
      });

      it('should return 200 and get json data', done => {
        request(app)
          .get('/api/furnitures')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('success');
            expect(res.body.products[0].Image).to.equal(null);
            done();
          });
      });

      after(async () => {
        await db.Product.destroy({ where: {}, truncate: true });
      });
    });

    describe('When Visit Pagination', () => {
      before(async () => {
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 1
        });
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 2
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 2
        });
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 2
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 2
        });
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000,
          CategoryId: 2
        });
        await db.Category.create({ name: 'test1' });
        await db.Category.create({ name: 'test2' });
      });

      it('When Visit Pagination without any query', done => {
        request(app)
          .get('/api/furnitures/pagination')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            expect(res.body.status).to.equal('success');
            expect(res.body.products.length).to.equal(10);
            expect(res.body.page).to.equal(1);
            done();
          });
      });

      it('When Visit Pagination with querying category', done => {
        request(app)
          .get('/api/furnitures/pagination?categoryId=2')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            expect(res.body.status).to.equal('success');
            expect(res.body.products.length).to.equal(5);
            expect(res.body.page).to.equal(1);
            done();
          });
      });

      it('When Visit Pagination with querying page', done => {
        request(app)
          .get('/api/furnitures/pagination?page=2')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            expect(res.body.status).to.equal('success');
            expect(res.body.products.length).to.equal(1);
            expect(res.body.page).to.equal(2);
            done();
          });
      });

      after(async () => {
        await db.Product.destroy({ where: {}, truncate: true });
        await db.Category.destroy({ where: {}, truncate: true });
      });
    });

    describe('When Visit Specific Product Page', () => {
      before(async () => {
        await cache.flushAll();
        await db.Product.create({
          name: 'Product1 Test',
          cost: 1111,
          price: 3000
        });
        await db.Product.create({
          name: 'Product2 Test',
          cost: 1111,
          price: 3000
        });
        await db.Image.create({ url: 'test1.jpg', ProductId: 1 });
        await db.Image.create({ url: 'test2.jpg', ProductId: 2 });
        await db.Color.create({ name: 'Yellow', ProductId: 1 });
        await db.Color.create({ name: 'Green', ProductId: 2 });
        await db.Inventory.create({ quantity: 23, ProductId: 1 });
        await db.Inventory.create({ quantity: 12, ProductId: 2 });
      });

      it('should return 200 and get json data from DB', done => {
        request(app)
          .get('/api/furnitures/1')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            db.Product.findByPk(1).then(product => {
              expect(res.body.status).to.equal('success');
              expect(res.body.queue).to.equal('First Request');
              expect(res.body.product.name).to.equal('Product1 Test');
              expect(res.body.Images[0].url).to.equal('test1.jpg');
              expect(res.body.Colors[0].name).to.equal('Yellow');
              expect(res.body.product.viewCounts + 1).to.equal(
                product.dataValues.viewCounts
              );
              expect(res.body.Colors[0].Inventory.quantity).to.equal(23);
              return done();
            });
          });
      });

      it('should return 400 and get error message from cache', done => {
        request(app)
          .get('/api/furnitures/33')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.message).to.equal('Fail to find product');
            done();
          });
      });

      it('should return 200 and get json data from cache', done => {
        request(app)
          .get('/api/furnitures/1')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            db.Product.findByPk(1).then(product => {
              expect(res.body.status).to.equal('success');
              expect(res.body.product.name).to.equal('Product1 Test');
              expect(res.body.Images[0].url).to.equal('test1.jpg');
              expect(res.body.Colors[0].name).to.equal('Yellow');
              expect(res.body.product.viewCounts + 1).to.equal(
                product.dataValues.viewCounts
              );
              expect(res.body.Colors[0].Inventory.quantity).to.equal(23);
              return done();
            });
          });
      });

      it('should return 400 and get error message from cache', done => {
        request(app)
          .get('/api/furnitures/3')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.message).to.equal('Fail to find product');
            done();
          });
      });

      after(async () => {
        await db.Product.destroy({ where: {}, truncate: true });
        await db.Image.destroy({ where: {}, truncate: true });
        await db.Color.destroy({ where: {}, truncate: true });
        await db.Inventory.destroy({ where: {}, truncate: true });
        await cache.flushAll();
      });
    });

    describe('When user search products', () => {
      before(async () => {
        await cache.flushAll();
        await db.Product.create({
          name: 'Async 衣櫃',
          cost: 1111,
          price: 3000,
          viewCounts: 3
        });
        await db.Product.create({
          name: '櫥櫃',
          cost: 1111,
          price: 3000,
          viewCounts: 1
        });
        await db.Product.create({
          name: '長椅',
          cost: 1111,
          price: 3000,
          viewCounts: 3
        });
        await db.Product.create({
          name: '八腳椅',
          cost: 1111,
          price: 3000,
          viewCounts: 7
        });
        await db.Product.create({
          name: '四腳椅',
          cost: 1111,
          price: 3000,
          viewCounts: 10
        });
      });

      it('should return 400 when no query is defined', done => {
        request(app)
          .get('/api/furnitures/search')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.queue).to.equal('First Request');
            expect(res.body.message).to.equal('Cannot find products');
            done();
          });
      });

      it('should return 400 when no query is defined and cache response', done => {
        request(app)
          .get('/api/furnitures/search')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.message).to.equal('Cannot find products');
            done();
          });
      });

      it('should return 400 when no products can be found', done => {
        request(app)
          .get('/api/furnitures/search')
          .query({ items: '床' })
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.queue).to.equal('First Request');
            expect(res.body.message).to.equal('Cannot find products');
            done();
          });
      });

      it('should return 400 when no products can be found and cache response', done => {
        request(app)
          .get('/api/furnitures/search')
          .query({ items: '床' })
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('error');
            expect(res.body.message).to.equal('Cannot find products');
            done();
          });
      });

      it('should return 200 when products can be found from DB', done => {
        request(app)
          .get('/api/furnitures/search')
          .query({ items: '椅' })
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('success');
            expect(res.body.queue).to.equal('First Request');
            expect(res.body.products.length).to.equal(3);
            expect(res.body.products[0].name).to.equal('四腳椅');
            expect(res.body.products[0].viewCounts).to.equal(10);
            done();
          });
      });

      it('should return 200 when products can be found from cache', done => {
        request(app)
          .get('/api/furnitures/search')
          .query({ items: '椅' })
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.body.status).to.equal('success');
            expect(res.body.products.length).to.equal(3);
            expect(res.body.products[0].name).to.equal('四腳椅');
            expect(res.body.products[0].viewCounts).to.equal(10);
            done();
          });
      });

      after(async () => {
        await db.Product.destroy({ where: {}, truncate: true });
        await cache.flushAll();
      });
    });
  });
});
