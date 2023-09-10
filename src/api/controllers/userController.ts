import bcrypt from 'bcryptjs';
import {Request, Response, NextFunction} from 'express';
import {verify} from 'jsonwebtoken';
import {User, UserOutput} from '../../interfaces/User';
import {validationResult} from 'express-validator';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import DBMessageResponse from '../../interfaces/DBMessageResponse';

// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password')
      .select('-role');
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password').select('-role');
    res.json(users);
  } catch (error) {
    next(new CustomError('Error while getting users', 500));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  try {
    if (await userModel.findOne({email: req.body.email})) {
      next(new CustomError('email not unique', 400));
      return;
    }
    const hashedPassword = bcrypt.hashSync(req.body.password);
    await userModel.create({
      ...req.body,
      password: hashedPassword,
    });
    const message: DBMessageResponse = {
      message: 'User created',
      data: {...req.body, password: undefined, role: undefined} as UserOutput,
    };
    res.status(200).json(message);
  } catch (error) {
    next(new CustomError('Error while creating user', 500));
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  //console.log(req.body);
  //console.log(req.headers.authorization);
  const token = req.headers.authorization?.split(' ')[1];
  verify(token as string, 'asdf', (err, decoded) => {
    if (err || !decoded) {
      next(new CustomError('Invalid token', 200));
      return;
    }
    decoded = decoded as User;
    console.log(decoded._id);
  });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  try {
    /*
    verify(token as string, 'asdf', (err, decoded) => {
      if (err || decoded) {
        next(new CustomError('Invalid token', 200));
        return;
      }*/
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const user = await userModel.findById(decodedUser._id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    /*
    if (req.body.password) {
      const hashedPassword = bcrypt.hashSync(req.body.password);
      await userModel
        .findByIdAndUpdate(user._id, {
          ...req.body,
          password: hashedPassword,
        })
        .select('-password -role');
    } else {
      await userModel
        .findByIdAndUpdate(user._id, {
          ...req.body,
        })
        .select('-password -role');
    }*/
    const updatedUser = await userModel
      .findByIdAndUpdate(user._id, {
        ...req.body,
        ...(req.body.password && {
          password: bcrypt.hashSync(req.body.password),
        }),
      })
      .setOptions({new: true})
      .select('-password -role -__v');
    console.log(user);
    const message: DBMessageResponse = {
      message: 'User updated',
      data: updatedUser as UserOutput,
    };
    res.status(200).json(message);
  } catch (error) {
    next(new CustomError('Error while updating user', 500));
  }
};

const userDeleteCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const user = (await userModel.findById(decodedUser._id)) as User;
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    await userModel.findByIdAndDelete(user._id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const message: DBMessageResponse = {
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      } as UserOutput,
    };
    res.status(200).json(message);
  } catch (error) {
    next(new CustomError('Error while deleting user', 500));
  }
};
/*
const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = sign(token, process.env.JWT_SECRET as string);
    const user = await userModel.findById(decodedToken);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json(user);
  } catch (error) {
    next(new CustomError('Error while checking token', 500));
  }
};

const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    passport.authenticate('jwt', {session: false}, (err: Error, user: User) => {
      if (err || !user) {
        next(new CustomError('Invalid token', 200));
        return;
      }
      req.login(user, {session: false}, (error) => {
        if (error) {
          next(new CustomError('Login error', 400));
          return;
        }
        const outputUser: UserOutput = {
          _id: user._id,
          user_name: user.user_name,
          email: user.email,
        };
        return res.json({user: outputUser});
      });
    })(req, res, next);
  } catch (error) {
    next(new CustomError('Error while checking token', 500));
  }*/
const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  verify(token as string, 'asdf', (err, decoded) => {
    if (err) {
      next(new CustomError('Invalid token', 500));
      return;
    }
    res.json({...req.user, role: undefined, password: undefined});
  });
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
