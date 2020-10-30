const express = require('express');
const sqlite3 = require('sqlite3');

const menuItemsRouter = new express.Router({ mergeParams: true });
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (err, menuItems) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menuItems: menuItems });
    }
  });
});

module.exports = menuItemsRouter;