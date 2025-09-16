import React from 'react';

const TestTailwind = () => {
  return (
    <div className="p-8 bg-blue-100 border-2 border-blue-500 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">
        Tailwind CSS Test
      </h1>
      <p className="text-blue-600">
        If you can see this styled properly with blue colors, padding, and borders, 
        then Tailwind CSS is working correctly!
      </p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Test Button
      </button>
    </div>
  );
};

export default TestTailwind;