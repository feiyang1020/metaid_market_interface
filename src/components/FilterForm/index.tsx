import { Button, Col, Form, Input, Row, Space } from "antd";
import { useModel } from "umi";
import Trans from "../Trans";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
export default () => {
  const { filterKey, setFilterKey, setLoading } = useModel('orders')
  const [form] = Form.useForm();
  return <Form
    {...formItemLayout}
    variant="filled"
    style={{ maxWidth: "80vw", width: 368, padding: 16 }}
    form={form}

  >
    <Form.Item label={<Trans>Path</Trans>} name="filter-path"

    >
      <Input
        size="large"
        style={{ width: '100%' }}
      />
    </Form.Item>
    <Form.Item label={<Trans>Level</Trans>} name="filter-level"

    >
      <Input
        size="large"
        style={{ width: '100%' }}
      />
    </Form.Item>

    <Form.Item label={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}> <span><Trans>Uncast</Trans></span><span>(<Trans>TokenID</Trans>)</span>
    </div>} name="filter-uncastTickId"

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
            setLoading(true);
            form.resetFields();
            setFilterKey({});
          }}
          size="large"
          block
        >
          <Trans>Clear</Trans>
        </Button>
      </Col>

      <Col span={12}>
        <Button type="primary" size="large" block onClick={() => {
          setLoading(true);
          setFilterKey(form.getFieldsValue());
        }}>
          <Trans>Confirmed</Trans>
        </Button>
      </Col>



    </Row>
  </Form>
}