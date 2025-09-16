import Popup from "@/components/ResponPopup"
import Trans from "@/components/Trans"
import { Button, Form, message, Row, Typography } from "antd"
import SelectChain from "./SelectChain"
import { useState } from "react"
import UploadAvatar from "./UploadAvatar"
import { image2Attach } from "@/utils/utlis"
import { useModel } from "umi"
import { createPin, createPinWithBtc } from "@/utils/pinV2"
type Props = {
    show: boolean,
    onClose: () => void,
    onSuccess: (pid: string) => void,

}
export default ({ show, onClose, onSuccess }: Props) => {
    const { feeRate } = useModel('wallet')
    const [chainNet, setChainNet] = useState<API.Chain>('mvc');
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const updateUser = async () => {
        try {
            const values = await form.validateFields();
            if (!values.avatar) {
                message.error('Please select an image');
                return;
            }
            setSubmitting(true);
            const [image] = await image2Attach(([values.avatar] as unknown) as FileList)
            values.avatar = Buffer.from(image.data, 'hex').toString('base64')
            const fileOptions: any[] = []
            fileOptions.push({
                body: values.avatar,
                contentType: 'image/png;binary',
                encoding: 'base64',
                flag: 'metaid',
                path: '/file',
                operation: 'create',
            })
            if (chainNet === 'btc') {
                const { revealTxIds, status } = await createPinWithBtc({
                    inscribeDataArray: fileOptions,
                    options: {
                        noBroadcast: 'no',
                        feeRate: feeRate,
                        network: 'mainnet',
                    },
                })
                if (status) throw new Error(status)
                onSuccess(`metafile://${revealTxIds[0]}i0`)
            } else {
                const ret = await createPin(fileOptions[0], {
                    network: 'mainnet',
                    signMessage: 'upload image file',
                    serialAction: 'finish',
                    transactions: [],
                    feeRate: feeRate,
                })
                if (ret.txid) {
                    onSuccess(`metafile://${ret.txid}i0`)
                }
            }
            // await updateUserInfo({ ...values, avatar: values.avatar });
            message.success('Upload success');
            onClose();
        } catch (error) {
            console.log(error);
        } finally {
            setSubmitting(false);
        }
    }
    return <Popup onClose={onClose} show={show} style={{
        borderRadius: 24,
    }} modalWidth={540} bodyStyle={{
        padding: "10px 36px 24px 36px"
    }} closable title={<Trans>Upload Image</Trans>}>
        <Row gutter={[12, 12]}>
            <SelectChain chainNet={chainNet} setChainNet={setChainNet} />
        </Row>
        <Form
            layout='vertical'
            form={form}
            style={{
                marginTop: 24
            }}
        >
            <Form.Item name='avatar' >
                <UploadAvatar />
            </Form.Item>

        </Form>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto'
        }}>
            <Button onClick={() => {
                onClose();
            }} block size='large' shape='round' variant='filled' color='primary'>
                <Trans>Close</Trans>
            </Button>
            <Button onClick={updateUser} block loading={submitting} size='large' type='primary' shape='round'>
                <Trans>Upload</Trans>
            </Button>
        </div>
    </Popup>
}