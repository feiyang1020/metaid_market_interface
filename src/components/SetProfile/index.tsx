import { Button, Form, Input, message, Upload } from "antd";
import Popup from "../ResponPopup";
import { useState } from "react";
import './index.less'
import { PlusOutlined } from "@ant-design/icons";
import UploadAvatar from "./UploadAvatar";
import { useModel } from "umi";
import SeleceFeeRateItem from "@/pages/inscribe/components/SeleceFeeRateItem";
import { getCreatePinFeeByNet } from "@/config";
import { image2Attach } from "@/utils/utlis";

type SetProfileProps = {
    show: boolean;
    onClose: () => void;
}
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 24 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 },
    },
};
export default ({ show, onClose }: SetProfileProps) => {
    const { btcConnector, init, connect, feeRates, network, disConnect } =
        useModel("wallet");
    const [visible, setVisible] = useState(false);
    const [submiting, setSubmiting] = useState<boolean>(false)
    const [form] = Form.useForm();
    const submit = async () => {
        if (!btcConnector) return;
        await form.validateFields();
        try {

            setSubmiting(true)

            const { name, avatar, feeRate } = form.getFieldsValue();
            const userData: any = { name };
            if (avatar) {
                const [image] = await image2Attach([avatar]);
                userData.avatar = Buffer.from(image.data, "hex").toString("base64")
            }
            const isSuccess = await btcConnector.createUserInfo({
                userData,
                options: {
                    feeRate: Number(feeRate),
                    network: network,
                    service: getCreatePinFeeByNet(network),
                }
            })
            await init();
            message.success('Success')
            onClose();
        } catch (err: any) {
            message.error(typeof err === 'string' ? err : err.message)
        }
        setSubmiting(true)
    }
    return <>

        <Popup
            title="MetaID Profile"
            modalWidth={452}
            show={show && visible}
            onClose={() => {
                onClose();
            }}
            closable={true}
            bodyStyle={{ padding: "28px 31px" }}
            className="setProfileModal"
        >
            <div className="setProfileWrap">

                <Form
                    {...formItemLayout}
                    variant="filled"
                    layout="vertical"
                    requiredMark='optional'
                    form={form}
                    initialValues={{}}
                >
                    <Form.Item
                        name="name"
                        label="Name"

                        rules={[{ required: true, message: 'Please input your name!', whitespace: true }]}
                    >
                        <Input size='large' />
                    </Form.Item>



                    <Form.Item label="Avatar" name="avatar" >
                        <UploadAvatar />
                    </Form.Item>
                    <Form.Item label="FeeRate" required name="feeRate">
                        <SeleceFeeRateItem feeRates={feeRates} />
                    </Form.Item>


                </Form>


                <div className="buttons">

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                            submit();
                        }}
                        loading={submiting}
                        block
                    >
                        OK
                    </Button>
                </div>
            </div>
        </Popup>
        <Popup
            title="Set up"
            modalWidth={452}
            show={show && !visible}
            onClose={() => {
                onClose();
            }}
            closable={true}
            bodyStyle={{ padding: "28px 31px" }}
            className="setProfileModal"
        >
            <div className="setProfileWrap">

                <div className="subTitle">
                    Your MetaID avatar and name have not been set up, affecting the use of the 'Launch Me' feature. Please go to Settings to complete your profile.
                </div>
                <div className="buttons">

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                            setVisible(true);
                        }}

                        block
                    >
                        Go to Setting
                    </Button>
                </div>
            </div>
        </Popup>
    </>
}