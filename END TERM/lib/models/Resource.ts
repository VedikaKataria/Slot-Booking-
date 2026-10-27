import mongoose, { Schema, Document, Model } from 'mongoose';

export type ResourceType = 'lab' | 'study_room' | 'court';

export interface IResource extends Document {
  name: string;
  type: ResourceType;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['lab', 'study_room', 'court'], required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);
