import React from "react";
import { Modal, List, Switch, Tag } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";

// Note: This component receives queueNames that have already been extracted 
// from their qualified format (bull:{queueName}) by the BullMQJobList component.

interface QueueManagementModalProps {
  isVisible: boolean;
  onCancel: () => void;
  queueNames: string[];
  pauseStates: Record<string, boolean>;
  onQueuePauseToggle?: (queueName: string, isPaused: boolean) => void;
}

const QueueManagementModal: React.FC<QueueManagementModalProps> = ({
  isVisible,
  onCancel,
  queueNames,
  pauseStates,
  onQueuePauseToggle,
}) => {
  return (
    <Modal
      title="Queue Management"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <List
        itemLayout="horizontal"
        dataSource={queueNames}
        renderItem={(queueName) => (
          <List.Item
            actions={onQueuePauseToggle ? [
              <Switch
                checkedChildren={<PlayCircleOutlined />}
                unCheckedChildren={<PauseCircleOutlined />}
                checked={!pauseStates[queueName]}
                onChange={(active) => onQueuePauseToggle(queueName, !active)}
              />
            ] : undefined}
          >
            <List.Item.Meta
              title={queueName}
              description={
                pauseStates[queueName] ? 
                <Tag color="red">PAUSED</Tag> : 
                <Tag color="green">ACTIVE</Tag>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default QueueManagementModal;