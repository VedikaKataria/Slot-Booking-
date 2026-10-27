import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBooking extends Document {
  resourceId: Types.ObjectId;
  userId: Types.ObjectId;
  bookingDate: string; // YYYY-MM-DD
  hour: number;        // 8 to 19
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingDate: { type: String, required: true },
    hour: { type: Number, required: true, min: 8, max: 19 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

// CRITICAL RULE: Database-level enforcement of single confirmed booking per slot
// Enforced natively via MongoDB Partial Unique Index
BookingSchema.index(
  { resourceId: 1, bookingDate: 1, hour: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
