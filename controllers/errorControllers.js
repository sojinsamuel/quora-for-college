//--------- Importing internal modules and files ----------
const AppError = require('../utils/appError.js');
require('dotenv').config();

//--------- Functional code for this file ---------
//All the cast errors by database will be handled here
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

//If validation fails at any stage then that erro will be handled here
const handleValidationErrorDB = (err) => {
  const errorMessage = Object.values(err.errors).map(el => el.message);
  const message = `${errorMessage.join('. ')}`;
  return new AppError(message, 400);
}

//If the jwt token is found tampered or expired then the error will be handled here
const handleIncorrectToken = (err) => {
  const message = 'Incorrect token please recheck or regenerate the token';
  return new AppError(message, 400);
}

//Error generated by expired token will be handled here
const handleExpiredToken = (err) => {
  const message = 'Token has expired. Please loging again';
  return new AppError(message, 400);
}

//This will send detailed error message as it's for Development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
}

//This will send abstracted error message as it's for Production environment
const sendErrorProd = (err, res) => {
  //If operational then send the alloted error message
  if(err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

  //If not operational then don't leak the error message instead send a generic error message
  } else {
    res.json({
      err
    })
  }
}

// This will work as a global error handler exporter
module.exports = (err, req, res, next) => {

  //Setting the basic information about the error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'err';

  //Checking if we should send detailed error log (development env) or abstracted error log (production env)
  if(process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if(process.env.NODE_ENV === 'production') {
    let error = err;

    //If Invalid id provided as "/:id" argument
    if(error.name === 'CastError') error = handleCastErrorDB(error);

    //If the validation in mongoose model fails
    if(error.name === 'ValidationError') error = handleValidationErrorDB(error);

    //If the Token is incorrect
    if(error.name === 'JsonWebTokenError') error = handleIncorrectToken(error);

    //If the token is timedout
    if(error.name === 'TokenExpiredError') error = handleExpiredToken(error);

    sendErrorProd(error, res);
  }
  
}