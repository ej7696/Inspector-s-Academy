import React from "react";

interface ButtonProps {
  text: string;
  onClick: () => void;
  style: 'primary' | 'secondary' | 'neutral';
}

interface InfoDialogProps {
  open: boolean;
  title: string;
  message: string;
  buttons: ButtonProps[];
}

const InfoDialog: React.FC<InfoDialogProps> = ({ open, title, message, buttons }) => {
  if (!open) return null;

  const getButtonClasses = (style: ButtonProps['style']) => {
    switch (style) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'neutral':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {buttons.map((btn) => (
            <button
              key={btn.text}
              onClick={btn.onClick}
              className={`px-4 py-2 rounded-lg font-semibold w-full sm:w-auto ${getButtonClasses(btn.style)}`}
            >
              {btn.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;
