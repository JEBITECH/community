import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Validation schemas
export const authValidationSchemas = {
  register: Joi.object({
    firstName: Joi.string().max(50).required().messages({
      'any.required': 'firstName is required',
      'string.max': 'firstName must not exceed 100 characters'
    }),
    lastName: Joi.string().max(50).required().messages({
      'any.required': 'Lastname is required',
      'string.max': 'lastName must not exceed 100 characters'
    }),

    phone: Joi.string().max(30).required().messages({
      'any.required': 'Phone is required',
      'string.max': 'phone must not exceed 30 characters'
    }),

    email: Joi.string().email().max(50).required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.max': 'email must not exceed 255 characters'
    }),
    password: Joi.string().min(8).max(50).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('user', 'admin', 'manager').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  confirmPasswordReset: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required()
  })
};