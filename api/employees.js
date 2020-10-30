const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const employeesRouter = new express.Router();

employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, employees) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ employees: employees });
    }
  });
});

const validateEmployee = (req, res, next) => {
  const { name, position, wage } = req.body.employee;
  if (!name || !position || !wage) {
    res.sendStatus(400);
  }
  next();
}

employeesRouter.post('/', validateEmployee, (req, res, next) => {
  const { name, position, wage } = req.body.employee;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  db.run(`INSERT INTO Employee (name, position, wage, is_current_employee) VALUES (
    $name, $position, $wage, $isCurrentEmployee
  )`, {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  }, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, employee) => {
        res.status(201).json({ employee: employee });
      });
    }
  });
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({ employee: req.employee });
});

employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
  const { name, position, wage } = req.body.employee;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee`, {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({ employee: employee });
      });
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${req.params.employeeId}`, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({ employee: employee });
      });
    }
  });
});

module.exports = employeesRouter;