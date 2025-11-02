import React from 'react';

interface Props {
    examName: string;
    bodyOfKnowledge: string;
    onStart: () => void;
    onCancel: () => void;
}

const InstructionsModal: React.FC<Props> = ({ examName, bodyOfKnowledge, onStart, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Instructions for {examName}</h1>
                <p className="text-gray-600 mb-4">Review the key knowledge areas for this exam before you begin.</p>
                
                <div className="flex-grow border-t border-b py-4 my-4 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {bodyOfKnowledge}
                    </pre>
                </div>

                <div className="flex justify-end gap-4 mt-4">
                    <button 
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Back
                    </button>
                    <button 
                        onClick={onStart}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;