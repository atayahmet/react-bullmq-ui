import React, { useState } from "react";
import { Modal, Tabs, Descriptions, Tag, Space, Typography, Alert, Spin, List, Tooltip } from "antd";
import type { TabsProps } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { JobTableDataType } from "../types";
import { getStatusColor, formatTimestamp } from "../utils/formatters";

const { Text, Paragraph } = Typography;

interface JobDetailModalProps {
  jobData: JobTableDataType | null;
  jobStatus: string;
  isVisible: boolean;
  onClose: () => void;
  logs?: string[];
  isLoadingLogs?: boolean;
  modalError?: string | null;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobData,
  jobStatus,
  isVisible,
  onClose,
  logs = [],
  isLoadingLogs = false,
  modalError = null,
}) => {
  const [activeTabKey, setActiveTabKey] = useState("1");

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  const renderJobData = () => {
    if (!jobData) return null;

    return (
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="ID">
          <Text copyable>{jobData.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Name">{jobData.name}</Descriptions.Item>
        <Descriptions.Item label="Queue">
          {jobData.queueName && jobData.queueName !== 'unknown' ? jobData.queueName : 
            jobData.originalJob && (jobData.originalJob as any).queueQualifiedName ? 
            (jobData.originalJob as any).queueQualifiedName.replace(/^bull:/, '') : 
            'unknown'}
          {jobData.queueName === 'unknown' && jobData.originalJob && 
            <Tooltip title="Extracting queue name from original job">
              <QuestionCircleOutlined style={{ marginLeft: 5 }} />
            </Tooltip>
          }
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(jobStatus)}>{jobStatus.toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {formatTimestamp(jobData.timestamp)}
        </Descriptions.Item>
        {jobData.processedOn && (
          <Descriptions.Item label="Processed At">
            {formatTimestamp(jobData.processedOn)}
          </Descriptions.Item>
        )}
        {jobData.finishedOn && (
          <Descriptions.Item label="Finished At">
            {formatTimestamp(jobData.finishedOn)}
          </Descriptions.Item>
        )}
        {jobData.attemptsMade > 0 && (
          <Descriptions.Item label="Attempts Made">{jobData.attemptsMade}</Descriptions.Item>
        )}
        {typeof jobData.progress !== "undefined" && (
          <Descriptions.Item label="Progress">
            {typeof jobData.progress === "object"
              ? JSON.stringify(jobData.progress)
              : String(jobData.progress)}
          </Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  const renderJobDataPayload = () => {
    if (!jobData || !jobData.data) return <Text>No data available</Text>;

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Paragraph>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(jobData.data, null, 2)}
          </pre>
        </Paragraph>
      </Space>
    );
  };

  const renderJobOptions = () => {
    if (!jobData || !jobData.opts) return <Text>No options available</Text>;

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Paragraph>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(jobData.opts, null, 2)}
          </pre>
        </Paragraph>
      </Space>
    );
  };

  const renderJobReturnValue = () => {
    if (!jobData || !jobData.returnvalue) return <Text>No return value available</Text>;

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Paragraph>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(jobData.returnvalue, null, 2)}
          </pre>
        </Paragraph>
      </Space>
    );
  };

  const renderJobError = () => {
    if (!jobData) return null;
    if (!jobData.failedReason && (!jobData.stacktrace || !jobData.stacktrace.length))
      return <Text>No error information available</Text>;

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        {jobData.failedReason && (
          <>
            <Text strong>Error Message:</Text>
            <Alert
              message={jobData.failedReason}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </>
        )}
        {jobData.stacktrace && jobData.stacktrace.length > 0 && (
          <>
            <Text strong>Stack Trace:</Text>
            <Paragraph>
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {jobData.stacktrace.join("\n")}
              </pre>
            </Paragraph>
          </>
        )}
      </Space>
    );
  };

  const renderJobLogs = () => {
    if (isLoadingLogs) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin>
            <div style={{ padding: 24 }}>Loading logs...</div>
          </Spin>
        </div>
      );
    }

    if (modalError) {
      return <Alert message={modalError} type="error" showIcon />;
    }

    if (logs.length === 0) {
      return <Text>No logs available</Text>;
    }

    return (
      <List
        size="small"
        bordered
        dataSource={logs}
        renderItem={(log) => (
          <List.Item>
            <Text code style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
              {log}
            </Text>
          </List.Item>
        )}
      />
    );
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Overview",
      children: renderJobData(),
    },
    {
      key: "2",
      label: "Data",
      children: renderJobDataPayload(),
    },
    {
      key: "3",
      label: "Options",
      children: renderJobOptions(),
    },
    {
      key: "4",
      label: "Return Value",
      children: renderJobReturnValue(),
    },
    {
      key: "5",
      label: "Error",
      children: renderJobError(),
    },
    {
      key: "6",
      label: "Logs",
      children: renderJobLogs(),
    },
  ];

  return (
    <Modal
      title={`Job Details: ${jobData?.name || ""} (${jobData?.id || ""})`}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Tabs activeKey={activeTabKey} onChange={handleTabChange} items={items} type="card" />
    </Modal>
  );
};

export default JobDetailModal;
