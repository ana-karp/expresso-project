const express = require('express');
const sqlite3 = require('sqlite3');

const menuItemsRouter = new express.Router({ mergeParams: true });
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `SELECT * FROM MenuItem WHERE id = ${menuItemId}`;
  db.get(sql, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (err, menuItems) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menuItems: menuItems });
    }
  });
});

const validateItem = (req, res, next) => {
  const { name, inventory, price } = req.body.menuItem;
  const menuId = req.params.menuId;
  if (!name || !inventory || !price || !menuId) {
    return res.sendStatus(400);
  }
  next();
}

menuItemsRouter.post('/', validateItem, (req, res, next) => {
  const { name, description, inventory, price } = req.body.menuItem;
  db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) 
  VALUES ($name, $description, $inventory, $price, $menuId)`, 
  {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: req.params.menuId
  }, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, menuItem) => {
        res.status(201).json({ menuItem: menuItem });
      })
    }
  })
});

menuItemsRouter.put('/:menuItemId', validateItem, (req, res, next) => {
  const { name, description, inventory, price } = req.body.menuItem;
  db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, 
  price = $price, menu_id = $menuId WHERE id = $menuItemId`,
  {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: req.params.menuId,
    $menuItemId: req.params.menuItemId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (err, menuItem) => {
        res.status(200).json({ menuItem: menuItem });
      });
    }
  });
})

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE id = ${req.params.menuItemId}`, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemsRouter;