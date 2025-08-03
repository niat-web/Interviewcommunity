// client/src/utils/formatters.js
  // Date formatting
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Date and time formatting
  export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };
  
  // Format currency (INR)
  export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format percentage
  export const formatPercentage = (value) => {
    if (value === undefined || value === null) return '';
    
    return `${value.toFixed(1)}%`;
  };
  
  // Format phone number
  export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Clean the input by removing everything except digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a standard 10-digit Indian mobile number
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    
    // If it includes country code (e.g. +91)
    if (cleaned.length > 10) {
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const number = cleaned.slice(-10);
      return `+${countryCode} ${number.slice(0, 5)}-${number.slice(5)}`;
    }
    
    // Return as is if it doesn't match expected formats
    return phoneNumber;
  };
  
  // Format name with initial
  export const formatNameWithInitial = (firstName, lastName) => {
    if (!firstName) return '';
    
    return lastName
      ? `${firstName} ${lastName.charAt(0)}.`
      : firstName;
  };
  
  // Truncate text with ellipsis
  export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    
    return `${text.slice(0, maxLength)}...`;
  };
  
  // Format HH:MM string to H:MM AM/PM
  export const formatTime = (timeString) => {
    if (!timeString || !timeString.includes(':')) return '';
    const [hour, minute] = timeString.split(':').map(Number);
    
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12; // Converts 0 and 12 to 12
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };
