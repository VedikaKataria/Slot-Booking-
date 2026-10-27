import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWaitlist extends Document {
  resourceId: Types.ObjectId;
  userId: Types.ObjectId;
  bookingDate: string;
  hour: number;
  status: 'waiting' | 'promoted' | 'cancelled';
  createdAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingDate: { type: String, required: true },
    hour: { type: Number, required: true, min: 8, max: 19 },
    status: { type: String, enum: ['waiting', 'promoted', 'cancelled'], default: 'waiting' },
  },
  { timestamps: true }
);

// Ensure a student can only join the waitlist once per slot
WaitlistSchema.index(
  { resourceId: 1, bookingDate: 1, hour: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: 'waiting' } }
);

export const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);
