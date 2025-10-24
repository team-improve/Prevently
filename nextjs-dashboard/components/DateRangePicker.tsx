'use client';

import React, { useState } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ""
}: DateRangePickerProps) {
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        {startDate && (
          <p className="text-xs text-gray-500 mt-1">{formatDateForDisplay(startDate)}</p>
        )}
      </div>

      <div className="flex items-center justify-center pt-6">
        <div className="w-8 h-px bg-gray-300"></div>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        {endDate && (
          <p className="text-xs text-gray-500 mt-1">{formatDateForDisplay(endDate)}</p>
        )}
      </div>
    </div>
  );
}