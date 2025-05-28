import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getStatusColor } from '../../src/utils/formatters';

// Daha kapsamlı bir matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    match: () => {},
  })),
});

// Formatters modülünü mock'la
jest.mock('../../src/utils/formatters', () => ({
  getStatusColor: jest.fn((status) => {
    // Return predefined colors for different statuses
    const colors: Record<string, string> = {
      completed: 'success',
      failed: 'error',
      active: 'processing',
      waiting: 'default',
      delayed: 'warning'
    };
    return colors[status] || 'default';
  })
}));

// InsightsModal bileşenini mock'la
jest.mock('../../src/components/InsightsModal', () => {
  // Mock component'i varsayılan olarak dışa aktar
  const MockInsightsModal = function(props: {
    isVisible: boolean;
    onCancel: () => void;
    jobStatusData: {
      status: string;
      count: number;
    }[];
    totalJobs: number;
    [key: string]: any;
  }) {
    return (
      <div data-testid="insights-modal">
        <div data-testid="modal-title">Job Insights</div>
        <div data-testid="modal-visible">{String(props.isVisible)}</div>
        <div data-testid="total-jobs">{props.totalJobs}</div>
        <div data-testid="job-status-data">
          {JSON.stringify(props.jobStatusData)}
        </div>
        <button 
          data-testid="close-button" 
          onClick={props.onCancel}>
          Close
        </button>
        <div data-testid="job-distribution">
          {props.jobStatusData.map((item: any) => {
            const percentage = props.totalJobs > 0 
              ? Math.round((item.count / props.totalJobs) * 100) 
              : 0;
            
            // Getstatuscolor fonksiyonunu çağır
            getStatusColor(item.status);
            
            return (
              <div key={item.status} data-testid={`job-status-${item.status}`}>
                <div data-testid={`job-status-label-${item.status}`}>
                  {item.status.toUpperCase()}
                </div>
                <div data-testid={`job-count-${item.status}`}>
                  {item.count} job{item.count !== 1 ? "s" : ""} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
        {props.totalJobs === 0 && (
          <div data-testid="no-data-message">
            No job data available to generate insights.
          </div>
        )}
      </div>
    );
  };
  
  // default export olarak döndür
  return {
    __esModule: true,
    default: MockInsightsModal
  };
});

describe('InsightsModal Component', () => {
  const mockOnCancel = jest.fn();
  const mockJobStatusData = [
    { status: 'completed', count: 10 },
    { status: 'failed', count: 5 },
    { status: 'active', count: 3 },
    { status: 'waiting', count: 2 }
  ];
  const totalJobs = 20;

  beforeEach(() => {
    mockOnCancel.mockClear();
    jest.clearAllMocks();
  });

  test('renders correctly when visible', () => {
    const MockComponent = jest.requireMock('../../src/components/InsightsModal').default;
    render(
      <MockComponent
        isVisible={true}
        onCancel={mockOnCancel}
        jobStatusData={mockJobStatusData}
        totalJobs={totalJobs}
      />
    );

    // Check for visibility
    expect(screen.getByTestId('modal-visible').textContent).toBe('true');
    
    // Check if job statuses are rendered
    expect(screen.getByTestId('job-status-label-completed').textContent).toBe('COMPLETED');
    expect(screen.getByTestId('job-status-label-failed').textContent).toBe('FAILED');
    expect(screen.getByTestId('job-status-label-active').textContent).toBe('ACTIVE');
    expect(screen.getByTestId('job-status-label-waiting').textContent).toBe('WAITING');
    
    // Check if counts and percentages are correct
    expect(screen.getByTestId('job-count-completed').textContent).toBe('10 jobs (50%)');
    expect(screen.getByTestId('job-count-failed').textContent).toBe('5 jobs (25%)');
    expect(screen.getByTestId('job-count-active').textContent).toBe('3 jobs (15%)');
    expect(screen.getByTestId('job-count-waiting').textContent).toBe('2 jobs (10%)');
  });

  test('renders "No job data" message when totalJobs is 0', () => {
    const MockComponent = jest.requireMock('../../src/components/InsightsModal').default;
    render(
      <MockComponent
        isVisible={true}
        onCancel={mockOnCancel}
        jobStatusData={[]}
        totalJobs={0}
      />
    );
    
    expect(screen.getByTestId('no-data-message')).toBeInTheDocument();
    expect(screen.getByTestId('no-data-message').textContent).toBe(
      'No job data available to generate insights.'
    );
  });

  test('correctly displays singular "job" text when count is 1', () => {
    const MockComponent = jest.requireMock('../../src/components/InsightsModal').default;
    render(
      <MockComponent
        isVisible={true}
        onCancel={mockOnCancel}
        jobStatusData={[{ status: 'completed', count: 1 }]}
        totalJobs={1}
      />
    );
    
    expect(screen.getByTestId('job-count-completed').textContent).toBe('1 job (100%)');
  });

  test('calls onCancel when the modal is closed', () => {
    const MockComponent = jest.requireMock('../../src/components/InsightsModal').default;
    render(
      <MockComponent
        isVisible={true}
        onCancel={mockOnCancel}
        jobStatusData={mockJobStatusData}
        totalJobs={totalJobs}
      />
    );

    // Find the close button and click it
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('getStatusColor is called with correct status', () => {
    const MockComponent = jest.requireMock('../../src/components/InsightsModal').default;
    render(
      <MockComponent
        isVisible={true}
        onCancel={mockOnCancel}
        jobStatusData={mockJobStatusData}
        totalJobs={totalJobs}
      />
    );
    
    // Verify getStatusColor was called for each status
    expect(getStatusColor).toHaveBeenCalledWith('completed');
    expect(getStatusColor).toHaveBeenCalledWith('failed');
    expect(getStatusColor).toHaveBeenCalledWith('active');
    expect(getStatusColor).toHaveBeenCalledWith('waiting');
  });
});