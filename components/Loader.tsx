
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loader {
          border: 2px solid #5C6BC0;
          border-top: 2px solid #FFFFFF;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div className="loader"></div>
    </>
  );
};
