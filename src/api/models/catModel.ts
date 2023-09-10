// TODO: mongoose schema for cat
import {Schema, model} from 'mongoose';
import {Cat} from '../../interfaces/Cat';

const catSchema = new Schema({
  cat_name: {
    type: String,
    required: true,
    unique: false,
  },
  weight: {
    type: Number,
  },
  filename: {
    type: String,
  },
  birthdate: {
    type: Date,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

export default model<Cat>('Cat', catSchema);
