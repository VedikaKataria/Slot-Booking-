'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { createResource, updateResource } from '@/lib/actions/resources';
import { Resource, ResourceType } from '@/lib/types';

interface AdminResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceToEdit?: Resource | null;
}

export const AdminResourceModal: React.FC<AdminResourceModalProps> = ({
  isOpen,
  onClose,
  resourceToEdit,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('lab');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = !!resourceToEdit;

  useEffect(() => {
    if (resourceToEdit) {
      setName(resourceToEdit.name);
      setType(resourceToEdit.type);
      setLocation(resourceToEdit.location);
      setDescription(resourceToEdit.description || '');
    } else {
      setName('');
      setType('lab');
      setLocation('');
      setDescription('');
    }
    setError(null);
    setSuccess(null);
  }, [resourceToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (isEditing) {
      formData.set('id', resourceToEdit.id);
    }
    formData.set('name', name);
    formData.set('type', type);
    formData.set('location', location);
    formData.set('description', description);

    try {
      const res = isEditing
        ? await updateResource(formData)
        : await createResource(formData);
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1000);
      } else {
        setError(res.message);
      }
    } catch {
      setError('Unable to save the resource. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Campus Resource' : 'Add Campus Resource'}
      description={
        isEditing
          ? 'Update the details, location, or equipment description of this facility.'
          : 'Create a new lab, study room, or sports court for students to reserve.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Input
          label="Resource Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AI & Robotics Lab Station 03"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resource Type
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="lab">Computer & Science Lab</option>
            <option value="study_room">Quiet Study Room</option>
            <option value="court">Sports Court</option>
          </select>
        </div>

        <Input
          label="Location"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Science Block, 2nd Floor, Room 210"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Equipment details, rules, or capacity..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Resource'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
