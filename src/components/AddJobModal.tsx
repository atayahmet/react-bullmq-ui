import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, Space, InputNumber, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

interface AddJobModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onAdd: (queueName: string, jobName: string, jobData: any, jobOptions?: any) => Promise<void>;
  availableQueueNames?: string[];
  isLoading: boolean;
}

interface JobOptions {
  delay?: number;
  attempts?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

const AddJobModal: React.FC<AddJobModalProps> = ({
  isVisible,
  onCancel,
  onAdd,
  availableQueueNames = [],
  isLoading,
}) => {
  const [form] = Form.useForm();
  const [advancedOptions, setAdvancedOptions] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Parse job data from JSON string
      let jobData;
      try {
        jobData = JSON.parse(values.jobData);
      } catch (error) {
        jobData = values.jobData; // If not valid JSON, use the text as is
      }

      // Collect job options
      const jobOptions: JobOptions = {};

      if (advancedOptions) {
        if (values.delay) jobOptions.delay = values.delay;
        if (values.attempts) jobOptions.attempts = values.attempts;
        if (values.removeOnComplete !== undefined)
          jobOptions.removeOnComplete = values.removeOnComplete;
        if (values.removeOnFail !== undefined) jobOptions.removeOnFail = values.removeOnFail;
      }

      await onAdd(values.queueName, values.jobName, jobData, jobOptions);
      form.resetFields();
      onCancel();
    } catch (error) {
      // Form validation error or job add error
      console.error("Failed to add job:", error);
    }
  };

  return (
    <Modal title="Add New Job" open={isVisible} onCancel={onCancel} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical">
        <Form.Item
          name="queueName"
          label="Queue"
          rules={[{ required: true, message: "Please select a queue" }]}
        >
          {availableQueueNames.length > 0 ? (
            <Select placeholder="Select a queue">
              {availableQueueNames.map((queueName) => (
                <Option key={queueName} value={queueName}>
                  {queueName}
                </Option>
              ))}
            </Select>
          ) : (
            <Input placeholder="Enter queue name" />
          )}
        </Form.Item>

        <Form.Item
          name="jobName"
          label="Job Name"
          rules={[{ required: true, message: "Please enter a job name" }]}
        >
          <Input placeholder="Enter job name" />
        </Form.Item>

        <Form.Item
          name="jobData"
          label="Job Data (JSON or text)"
          rules={[{ required: true, message: "Please enter job data" }]}
        >
          <TextArea
            rows={4}
            placeholder='Enter job data as JSON (e.g., {"key": "value"}) or text'
          />
        </Form.Item>

        <Form.Item>
          <Switch
            checked={advancedOptions}
            onChange={setAdvancedOptions}
            checkedChildren="Hide Advanced Options"
            unCheckedChildren="Show Advanced Options"
          />
        </Form.Item>

        {advancedOptions && (
          <>
            <Form.Item name="delay" label="Delay (ms)">
              <InputNumber min={0} placeholder="Delay in milliseconds" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="attempts" label="Attempts">
              <InputNumber min={1} placeholder="Number of attempts" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="removeOnComplete" label="Remove on Complete" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="removeOnFail" label="Remove on Fail" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleSubmit}
              loading={isLoading}
            >
              Add Job
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddJobModal;
