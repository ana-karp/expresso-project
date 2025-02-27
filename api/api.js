const express = require('express');
const employeesRouter = require('./employees');
const menusRouter = require('./menus');

const apiRouter = new express.Router();

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;