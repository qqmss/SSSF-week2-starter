import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {Cat} from '../../interfaces/Cat';
import catModel from '../models/catModel';
import {User} from '../../interfaces/User';
import {verify} from 'jsonwebtoken';
import userModel from '../models/userModel';

// TODO: create following functions:
// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const cats = await catModel.find({owner: decodedUser._id});
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error while getting cats', 500));
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const topRight = req.query.topRight.split(',');
    const bottomLeft = req.query.bottomLeft.split(',');
    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $box: [
            [Number(bottomLeft[0]), Number(bottomLeft[1])],
            [Number(topRight[0]), Number(topRight[1])],
          ],
        },
      },
    });
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error while getting cats', 500));
  }
};
// - catPutAdmin - only admin can change cat owner
//FIXME: only admin can change cat owner
const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
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
    //FIXME: only admin can change cat owner
    const cat = await catModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const message: DBMessageResponse = {
      message: 'Cat updated',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Error while updating cat', 500));
  }
};

// - catDeleteAdmin - only admin can delete cat
const catDeleteAdmin = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  console.log('catDeleteAdmin', req.params.id);
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
    const cat = await catModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const message: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Error while deleting cat', 500));
  }
};

// - catDelete - only owner can delete cat
const catDelete = async (
  req: Request<{id: string}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  console.log('catDelete', req.params.id);
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
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const user = (await userModel.findById(decodedUser._id)) as User;
    console.log(cat.owner, user._id);
    if (!cat.owner.equals(user._id)) {
      next(new CustomError('Only owner can delete cat', 403));
      return;
    }
    await catModel.findByIdAndDelete(req.params.id);
    const message: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Error while deleting cat', 500));
    return;
  }
};

// - catPut - only owner can update cat
const catPut = async (
  req: Request<{id: string}, {}, Cat>,
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
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const token = req.headers.authorization?.split(' ')[1];
    const decodedUser = verify(token as string, 'asdf') as User;
    const user = (await userModel.findById(decodedUser._id)) as User;
    if (!cat.owner.equals(user._id)) {
      next(new CustomError('Only owner can update cat', 403));
      return;
    }
    const updatedCat = await catModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    const message: DBMessageResponse = {
      message: 'Cat updated',
      data: updatedCat as Cat,
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Error while updating cat', 500));
  }
};

// - catGet - get cat by id
const catGet = async (
  req: Request<{id: string}, {}, {}>,
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
    const cat = await catModel
      .findById(req.params.id)
      .populate('owner', '-password -role');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error while getting cat', 500));
  }
};

// - catListGet - get all cats
const catListGet = async (
  req: Request<{}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cats = await catModel.find().populate('owner', '-password -role');
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error while getting cats', 500));
  }
};

// - catPost - create new cat
const catPost = async (
  req: Request<{}, {}, Cat>,
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
    const cat = await catModel.create({...req.body, owner: decodedUser._id});
    const message: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.status(200).json(message);
  } catch (error) {
    next(new CustomError('Error while creating cat', 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
