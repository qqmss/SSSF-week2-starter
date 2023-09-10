import {Document} from 'mongoose';

interface User extends Document {
  user_name: string; // this is not username, just firsname lastname
  email: string; // shoud be unique
  role: 'user' | 'admin'; // don't send this
  password: string; // don't send this
}

interface UserOutput {
  _id: string;
  user_name: string;
  email: string;
}

interface LoginUser {
  username: string;
  password: string;
}

interface UserTest {
  user_name: string;
  email: string;
  password: string;
}

export {User, UserOutput, LoginUser, UserTest};
