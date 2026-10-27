import { Resource } from '@/lib/models/Resource';
import { connectDB } from './mongodb';

export const SEED_RESOURCES = [
  {
    name: 'Computer Lab 101 - High Performance Workstations',
    type: 'lab' as const,
    location: 'Science & Tech Block, 1st Floor, Room 101',
    description: 'High-performance computing workstations equipped for coding and simulations.',
    isActive: true,
  },
  {
    name: 'AI & Robotics Lab',
    type: 'lab' as const,
    location: 'Innovation Center, 2nd Floor, Room 204',
    description: 'Equipped with GPU development rigs and robotics prototyping hardware.',
    isActive: true,
  },
  {
    name: 'Silent Study Pod A',
    type: 'study_room' as const,
    location: 'Central Library, 2nd Floor',
    description: 'Soundproof individual study pod for focused and distraction-free study.',
    isActive: true,
  },
  {
    name: 'Group Discussion Room 3',
    type: 'study_room' as const,
    location: 'Student Activity Center, Room 108',
    description: 'Collaborative workspace equipped with whiteboard and presentation display.',
    isActive: true,
  },
  {
    name: 'Badminton Court 1',
    type: 'court' as const,
    location: 'Indoor Sports Complex',
    description: 'Standard tournament-grade wooden floor indoor badminton court.',
    isActive: true,
  },
  {
    name: 'Tennis Court A',
    type: 'court' as const,
    location: 'Outdoor Sports Pavilion',
    description: 'Hardcourt outdoor tennis court with floodlights for evening games.',
    isActive: true,
  },
];

export async function ensureSeedResources() {
  await connectDB();
  const count = await Resource.countDocuments();
  if (count === 0) {
    await Resource.insertMany(SEED_RESOURCES);
  }
}
