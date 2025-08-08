import React from 'react';

const SectionTitle = ({ title }) => {
  return (
    <div className="w-full py-4 mb-10 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-nunito text-center text-white">
        {title}
      </h2>
    </div>
  );
};

export default SectionTitle;


