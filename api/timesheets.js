const express = require('express');
const sqlite3 = require('sqlite3');

const timesheetsRouter = new express.Router({ mergeParams: true });
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`;
  db.get(sql, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`, (err, timesheets) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ timesheets: timesheets });
    }
  });
});

const validateTimesheet = (req, res, next) => {
  const { hours, rate, date } = req.body.timesheet;
  if (!hours || !rate || !date ) {
    res.sendStatus(400);
  }
  next();
}

timesheetsRouter.post('/', validateTimesheet, (req, res, next) => {
  const { hours, rate, date } = req.body.timesheet;
  const employeeId = req.params.employeeId;
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES (
    $hours, $rate, $date, $employeeId
  )`, {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: employeeId
  }, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (err, timesheet) => {
        res.status(201).json({ timesheet: timesheet });
      })
    }
  })
});

timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
  const { hours, rate, date } = req.body.timesheet;
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId 
  WHERE id = $timesheetId`, {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: req.params.employeeId,
    $timesheetId: req.params.timesheetId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err, timesheet) => {
        res.status(200).json({ timesheet: timesheet });
      });
    }
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
