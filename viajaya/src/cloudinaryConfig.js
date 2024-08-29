import { useState } from 'react';

const cloudinaryConfig = {
  cloudName: 'dbxwx3m3l',
  uploadPreset: 'viajaya',
};

export const openCloudinaryWidget = (callback) => {
  const cloudinaryWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: cloudinaryConfig.cloudName,
      uploadPreset: cloudinaryConfig.uploadPreset,
      multiple: true,
      folder: 'packs',
    },
    (error, result) => {
      if (result.event === 'success') {
        callback(result.info.secure_url);  // Retorna la URL segura
      }
    }
  );
  cloudinaryWidget.open();
};




