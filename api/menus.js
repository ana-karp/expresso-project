const express = require('express');
const sqlite3 = require('sqlite3');
const menuItemsRouter = require('./menuItems');

const menusRouter = new express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menus: menus });
    }
  })
});

const validateMenu = (req, res, next) => {
  const { title } = req.body.menu;
  if (!title) {
    res.sendStatus(400);
  }
  next();
}

menusRouter.post('/', validateMenu, (req, res, next) => {
  db.run(`INSERT INTO Menu (title) VALUES ($title)`, {
    $title: req.body.menu.title
  }, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, menu) => {
        res.status(201).json({ menu: menu })
      });
    }
  });
});

menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get(`SELECT * FROM Menu WHERE id = ${menuId}`, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({ menu: req.menu });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  const { title } = req.body.menu;
  db.run(`UPDATE Menu SET title = $title WHERE id = ${req.params.menuId}`, {
    $title: title
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, menu) => {
        res.status(200).json({ menu: menu});
      });
    }
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      db.run(`DELETE FROM Menu WHERE id = ${req.params.menuId}`, (err) => {
        res.sendStatus(204);
      });
    }
  });
});

module.exports = menusRouter;