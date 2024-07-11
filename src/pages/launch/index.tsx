import { Col, Form, Input, Row, Grid, Button, InputNumber } from 'antd';
import './index.less'
import { useModel, useSearchParams, history } from "umi";
import MetaIdAvatar from '@/components/MetaIdAvatar';
import { useState } from 'react';
import NumberFormat from '@/components/NumberFormat';
const { useBreakpoint } = Grid;
export default () => {
    const [form] = Form.useForm();
    const { sm } = useBreakpoint();
    const { authParams, connected, connect, feeRates, network, disConnect, btcConnector, btcAddress, avatar, userName } =
        useModel("wallet");
    const [submiting, setSubmiting] = useState<boolean>(false);
    const launch = async () => {
        setSubmiting(true);
        const ret = await form.validateFields();
        console.log(ret);
        setSubmiting(false);
    }
    return <div className="launchPage">
        <div className="user">
            <MetaIdAvatar avatar={avatar} size={124} />
            <div className="name">{userName || 'unnamed'}</div>
            <div className="metaid">Metaid：451269741</div>
        </div>
        <Form
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            form={form}
            layout="vertical"
            requiredMark='optional'
            variant="borderless"
            className='formWrap'
            initialValues={{
                amountPerMint: 21000000,
                liqPerMint: 1200,
            }}
        >

            <Row gutter={[24, 0]}>
                <Col md={12} xs={24} >
                    <Form.Item label="Ticker" name='ticker' rules={[{ required: true }]} className='formItem'>
                        <Input placeholder="input ticker" value={'21,000,000'} />
                    </Form.Item>
                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Followers Num" name='followers' rules={[{ required: true }]} className='formItem'>
                        <InputNumber placeholder="Followers Num" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Amount Per Mint" name='amountPerMint' rules={[{ required: true }]} className='formItem'>
                        <InputNumber placeholder="Amount Per Mint" style={{ width: '100%' }} />

                    </Form.Item>
                    <div className='totalSupply'> Total Supply: <NumberFormat value={'0'} isBig decimal={0} /></div>

                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Liquidity Per Mint" name='liqPerMint' rules={[{ required: true }]} className='formItem'>
                        <InputNumber placeholder="Liquidity Per Mint" formatter={value => `${value} stas`} style={{ width: '100%' }} />
                    </Form.Item>
                    <div className='totalSupply'> Initial Price   <NumberFormat value={'1200'} isBig decimal={0} suffix=' stas' /></div>
                </Col>
                <Col md={24} xs={24} >
                    <Form.Item label="Message" name='message' className='formItem' >
                        <Input placeholder="Leave your message to your followers." />
                    </Form.Item>
                </Col>
                <Col offset={sm ? 6 : 0} span={sm ? 12 : 24}>
                    {!connected ? (
                        <Button
                            block
                            className="submit"
                            size="large"
                            type="primary"
                            onClick={connect}
                            style={{ height: 60 }}
                        >
                            Connect Wallet
                        </Button>
                    ) : (
                        <Button
                            block
                            size="large"
                            loading={submiting}
                            type="primary"
                            onClick={launch}
                            style={{ height: 60 }}
                            className="submit"

                        >
                            Launch
                        </Button>
                    )}
                </Col>
            </Row>

        </Form>
    </div>
}