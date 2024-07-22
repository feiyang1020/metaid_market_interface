import { Avatar, Button, Form, Input, message, Upload } from "antd";
import Popup from "../ResponPopup";
import { useEffect, useState } from "react";
import './index.less'
import { PlusOutlined } from "@ant-design/icons";
import UploadAvatar from "./UploadAvatar";
import { useModel } from "umi";
import SeleceFeeRateItem from "@/pages/inscribe/components/SeleceFeeRateItem";
import { getCreatePinFeeByNet } from "@/config";
import { image2Attach } from "@/utils/utlis";
import Meta from "antd/es/card/Meta";
import MetaIdAvatar from "../MetaIdAvatar";
import CustomizeRequiredMark from "../CustomReqMark";

type SetProfileProps = {
    show?: boolean;
    onClose: () => void;
    editVisible?: boolean;
    setEditVisible?: () => void
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
export default ({ show = false, onClose, editVisible = false, setEditVisible }: SetProfileProps) => {
    const { btcConnector, init, connect, feeRate, network, disConnect, userName, avatar } =
        useModel("wallet");
    const [submiting, setSubmiting] = useState<boolean>(false)
    const [form] = Form.useForm();
    const submit = async () => {
        if (!btcConnector) return;
        await form.validateFields();
        try {

            setSubmiting(true)

            const { name, avatar: newAvatar } = form.getFieldsValue();
            const userData: any = { name };
            if (newAvatar) {
                const [image] = await image2Attach([newAvatar]);
                userData.avatar = Buffer.from(image.data, "hex").toString("base64")
            }
            // if (userName) {
            //     const ret = await btcConnector.updateUserInfo({
            //         userData,
            //         options: {
            //             feeRate: Number(feeRate),
            //             network: network,
            //             service: getCreatePinFeeByNet(network),
            //         }
            //     })
            // }
            const ret = await btcConnector.createUserInfo({
                userData,
                options: {
                    feeRate: Number(feeRate),
                    network: network,
                    service: getCreatePinFeeByNet(network),
                }
            })
            await init();
            if (ret.nameRes && ret.nameRes.status) {
                throw new Error(ret.nameRes.status)
            }
            if (ret.avatarRes && ret.avatarRes.status) {
                throw new Error(ret.nameRes.status)
            }

            await init();
            message.success('Success')
            onClose();
        } catch (err: any) {
            message.error(typeof err === 'string' ? err : err.message)
        }
        setSubmiting(false)
    }

    useEffect(() => {
        if (userName) {
            form.setFieldValue('name', userName)
        }
    }, [userName])
    return <>

        <Popup
            title="MetaID Profile"
            modalWidth={452}
            show={editVisible}
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
                    requiredMark={CustomizeRequiredMark}
                    form={form}
                    initialValues={{
                        name: userName,
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Name"

                        rules={[{ required: true, message: 'Please input your name!', whitespace: true }]}
                    >
                        <Input size='large' />
                    </Form.Item>
                    {
                        avatar && <Form.Item label={<div className="currentAvatar">Current <div className="tag">AVATAR </div></div>}  >
                            <MetaIdAvatar size={100} avatar={avatar} />
                        </Form.Item>
                    }



                    <Form.Item label={avatar ? "New Avatar" : 'Avatar'}  name="avatar" >
                        <UploadAvatar />
                    </Form.Item>
                    {/* <Form.Item label="FeeRate" required name="feeRate">
                        <SeleceFeeRateItem feeRates={feeRates} />
                    </Form.Item> */}


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
            title="Set Up"
            modalWidth={452}
            show={show}
            onClose={() => {
                onClose();
            }}
            closable={true}
            bodyStyle={{ padding: "28px 31px" }}
            className="setProfileModal"
        >
            <div className="setProfileWrap">

                <div className="subTitle">
                    Your MetaID avatar and name have not been set up, affecting the use of the 'Launch Me' feature. Please go to settings to complete your profile.
                </div>
                <div className="buttons">

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                            setEditVisible && setEditVisible();
                        }}
                        block
                    >
                        Go To Setting
                    </Button>
                </div>
            </div>
        </Popup>
    </>
}