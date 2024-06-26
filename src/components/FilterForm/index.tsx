import { Button, Col, Form, Input, Row, Space } from "antd";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};
export default () => {
  const [form] = Form.useForm();
  return <Form
    {...formItemLayout}
    variant="filled"
    style={{ maxWidth: "96vw", width: 368, padding: 16 }}
    form={form}

  >
    <Form.Item label="Path" name="path"

    >
      <Input
        size="large"
        style={{ width: '100%' }}
      />
    </Form.Item>
    <Form.Item label="Level" name="level"

    >
      <Input
        size="large"
        style={{ width: '100%' }}
      />
    </Form.Item>

    <Form.Item label="Uncast" name="uncast"

    >
      <Input
        size="large"
        style={{ width: '100%' }}
      />
    </Form.Item>

    <Row gutter={[24, 24]}>
      <Col span={12}>
        <Button
          onClick={() => {
            form.resetFields();
          }}
          size="large"
          block
        >
          Clear
        </Button>
      </Col>

      <Col span={12}>
        <Button type="primary" size="large" block disabled>
          Confirmed
        </Button>
      </Col>



    </Row>
  </Form>
}