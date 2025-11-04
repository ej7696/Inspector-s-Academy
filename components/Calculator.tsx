import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

const Calculator: React.FC<Props> = ({ onClose }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [operator, setOperator] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);

  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 200 });
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, posX: number, posY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPosition({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        });
      }
      if (isResizing && resizeStartRef.current) {
        const dw = e.clientX - resizeStartRef.current.x;
        const dh = e.clientY - resizeStartRef.current.y;
        setSize({
          width: Math.max(240, resizeStartRef.current.width + dw),
          height: Math.max(320, resizeStartRef.current.height + dh),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);


  const clearDisplay = () => {
    setDisplayValue('0');
    setOperator(null);
    setPreviousValue(null);
    setWaitingForOperand(true);
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
      setWaitingForOperand(false);
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setPreviousValue(newValue);
      setDisplayValue(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prev: number, current: number, op: string) => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return prev / current;
      default: return current;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(displayValue);
    if (operator && previousValue !== null) {
      const newValue = calculate(previousValue, inputValue, operator);
      setDisplayValue(String(newValue));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const calcButtons = [
    { label: 'C', action: clearDisplay, className: 'col-span-2 bg-red-500 hover:bg-red-600' },
    { label: '±', action: () => setDisplayValue(String(parseFloat(displayValue) * -1)), className: 'bg-gray-200 hover:bg-gray-300' },
    { label: '/', action: () => performOperation('/'), className: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: '7', action: () => inputDigit('7') },
    { label: '8', action: () => inputDigit('8') },
    { label: '9', action: () => inputDigit('9') },
    { label: '*', action: () => performOperation('*'), className: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: '4', action: () => inputDigit('4') },
    { label: '5', action: () => inputDigit('5') },
    { label: '6', action: () => inputDigit('6') },
    { label: '-', action: () => performOperation('-'), className: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: '1', action: () => inputDigit('1') },
    { label: '2', action: () => inputDigit('2') },
    { label: '3', action: () => inputDigit('3') },
    { label: '+', action: () => performOperation('+'), className: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: '0', action: () => inputDigit('0'), className: 'col-span-2' },
    { label: '.', action: inputDecimal },
    { label: '=', action: handleEquals, className: 'bg-blue-500 hover:bg-blue-600' },
  ];

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: '240px',
        minHeight: '320px',
      }}
    >
      <div
        className="h-8 bg-gray-200 rounded-t-lg flex items-center justify-between px-2 cursor-move"
        onMouseDown={handleMouseDownDrag}
      >
        <span className="font-semibold text-gray-700 text-sm">Calculator</span>
        <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold">&times;</button>
      </div>

      <div className="flex-grow flex flex-col p-2">
        <div className="bg-gray-800 text-white text-right text-4xl p-4 rounded-md mb-2 break-all">
          {displayValue}
        </div>
        <div className="grid grid-cols-4 gap-2 flex-grow">
          {calcButtons.map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`rounded-md text-xl font-semibold transition-colors
                ${btn.className || 'bg-gray-100 hover:bg-gray-200'}
                ${['/', '*', '-', '+', '='].includes(btn.label) ? 'text-white' : 'text-gray-800'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
       <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleMouseDownResize}
        style={{ background: 'repeating-linear-gradient(45deg, #ccc, #ccc 1px, transparent 1px, transparent 3px)' }}
      ></div>
    </div>
  );
};

export default Calculator;