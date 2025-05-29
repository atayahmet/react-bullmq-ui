import React, { useState } from "react";
import { Modal, List, Switch, Tag, Button, Select, Space, Popconfirm, Typography } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined, DeleteOutlined } from "@ant-design/icons";
// Import CSS class names
import * as classNames from "../utils/classNames";

const { Text } = Typography;
const { Option } = Select;

// Available job statuses for clearing
const JOB_STATUSES = [
  'failed',
  'active',
  'paused',
  'completed',
  'wait',
  'prioritized',
  'delayed'
];

interface QueueManagementModalProps {
  isVisible: boolean;
  onCancel: () => void;
  queueNames: string[];
  pauseStates: Record<string, boolean>;
  onQueuePauseToggle?: (queueName: string, isPaused: boolean) => void;
  onQueueJobClear?: (queueName: string, status: string) => Promise<void>;
  jobStatusCounts?: Record<string, Record<string, number>>;
}

const QueueManagementModal: React.FC<QueueManagementModalProps> = ({
  isVisible,
  onCancel,
  queueNames,
  pauseStates,
  onQueuePauseToggle,
  onQueueJobClear,
  jobStatusCounts,
}) => {
  // Status seçimleri için state
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string[]>>({});
  const [isClearing, setIsClearing] = useState<Record<string, boolean>>({});

  const handleStatusChange = (queueName: string, statuses: string[]) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [queueName]: statuses
    }));
  };

  const handleClearJobs = async (queueName: string) => {
    if (!onQueueJobClear || !selectedStatuses[queueName]?.length) return;
    
    try {
      setIsClearing(prev => ({ ...prev, [queueName]: true }));
      await onQueueJobClear(queueName, selectedStatuses[queueName][0]);
    } catch (error) {
      console.error(`Failed to clear jobs for queue ${queueName}:`, error);
    } finally {
      setIsClearing(prev => ({ ...prev, [queueName]: false }));
    }
  };

  return (
    <Modal
      title="Queue Management"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <List
        itemLayout="horizontal"
        dataSource={queueNames}
        renderItem={(queueName) => (
          <List.Item>
            <List.Item.Meta
              title={queueName}
              description={
                pauseStates[queueName] ? 
                <Tag color="red">PAUSED</Tag> : 
                <Tag color="green">ACTIVE</Tag>
              }
            />
            <Space size="middle">
              {typeof onQueueJobClear === 'function' && (
                <div>
                  <Space direction="vertical" size="small">
                    <Select
                      style={{ width: 200 }}
                      placeholder="Select job status"
                      value={selectedStatuses[queueName]?.[0] || undefined}
                      onChange={(value) => handleStatusChange(queueName, value ? [value] : [])}
                    >
                      {JOB_STATUSES.map(status => {
                        // Get the count for this status and queue, default to 0 if not available
                        const count = jobStatusCounts?.[queueName]?.[status] || 0;
                        return (
                          <Option key={status} value={status}>
                            {status.toUpperCase()} {(count > 0 || count === 0) && `(${count})`}
                          </Option>
                        );
                      })}
                    </Select>
                    <Popconfirm
                      title="Clear jobs"
                      description={`Are you sure you want to clear all ${selectedStatuses[queueName]?.[0]?.toUpperCase()} jobs?`}
                      onConfirm={() => handleClearJobs(queueName)}
                      okText="Yes"
                      cancelText="No"
                      disabled={!selectedStatuses[queueName]?.length}
                    >
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        loading={isClearing[queueName]}
                        disabled={!selectedStatuses[queueName]?.length}
                        size="small"
                        block
                      >
                        Clear Jobs
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              )}
              
              {onQueuePauseToggle && (
                <Switch
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                  checked={!pauseStates[queueName]}
                  onChange={(active) => onQueuePauseToggle(queueName, !active)}
                />
              )}
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default QueueManagementModal;