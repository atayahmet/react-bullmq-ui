import React from "react";
import { Modal, Progress, Card, Row, Col, Typography } from "antd";
import { getStatusColor } from "../utils/formatters";

const { Title, Text } = Typography;

interface InsightsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  jobStatusData: {
    status: string;
    count: number;
  }[];
  totalJobs: number;
}

const InsightsModal: React.FC<InsightsModalProps> = ({
  isVisible,
  onCancel,
  jobStatusData,
  totalJobs,
}) => {
  return (
    <Modal
      title="Job Insights"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Title level={4}>Job Status Distribution</Title>
      <Text type="secondary">
        A graphical representation of your job status distribution across all queues.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {jobStatusData.map((item) => {
          const percentage = totalJobs > 0 ? Math.round((item.count / totalJobs) * 100) : 0;
          return (
            <Col span={24} key={item.status}>
              <Card size="small" variant="outlined">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text strong>{item.status.toUpperCase()}</Text>
                  <Text>
                    {item.count} job{item.count !== 1 ? "s" : ""} ({percentage}%)
                  </Text>
                </div>
                <Progress
                  percent={percentage}
                  strokeColor={getStatusColor(item.status)}
                  size="small"
                  showInfo={false}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {totalJobs === 0 && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Text type="secondary">No job data available to generate insights.</Text>
        </div>
      )}
    </Modal>
  );
};

export default InsightsModal;