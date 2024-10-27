import React from 'react';
import { ChevronDown } from 'lucide-react';

const SelectContext = React.createContext(null);

export const Select = ({ children, value, onValueChange, disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (value) => {
    setSelectedValue(value);
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ open, setOpen, value: selectedValue, onSelect: handleSelect, disabled }}>
      {children}
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className = '' }) => {
  const { open, setOpen, disabled } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => !disabled && setOpen(!open)}
      className={`flex items-center justify-between w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span className="block truncate">{value || placeholder}</span>;
};

export const SelectContent = ({ children, className = '' }) => {
  const { open, setOpen } = React.useContext(SelectContext);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div 
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value, className = '' }) => {
  const { value: selectedValue, onSelect } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      className={`relative cursor-pointer select-none py-1.5 px-3 text-sm hover:bg-gray-100 ${
        isSelected ? 'bg-gray-100' : ''
      } ${className}`}
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  );
};