/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Function that replicates the same logic used in BullMQJobList
const isRetryEnabled = (status: string): boolean => status === 'failed';

// A mock button component that uses the same logic
function RetryButtonMock({ status, onClick }: { status: string, onClick?: () => void }) {
  return (
    <button 
      data-testid="retry-button"
      disabled={!isRetryEnabled(status)}
      onClick={onClick}
    >
      Retry
    </button>
  );
}

describe('Retry Button Unit Tests', () => {
  // Test all possible job statuses
  const allStatuses = ['active', 'completed', 'waiting', 'delayed', 'paused', 'waiting-children', 'failed'];
  
  test.each(allStatuses)('retry button behavior for %s jobs', (status: string) => {
    const mockClick = jest.fn();
    render(<RetryButtonMock status={status} onClick={mockClick} />);
    
    const button = screen.getByTestId('retry-button');
    
    if (status === 'failed') {
      // For failed jobs, button should be enabled
      expect(button).not.toBeDisabled();
      
      // When clicked, it should call the handler
      fireEvent.click(button);
      expect(mockClick).toHaveBeenCalledTimes(1);
    } else {
      // For all other statuses, button should be disabled
      expect(button).toBeDisabled();
    }
  });
});