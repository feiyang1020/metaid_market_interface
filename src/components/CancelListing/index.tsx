import { Button } from "antd";
import Popup from "../ResponPopup";
import './index.less'
import Trans from "../Trans";
type Props = {
    show: boolean
    onClose: () => void
    submiting: boolean,
    handleCancel: () => void,
}
export default ({ show, onClose, handleCancel, submiting }: Props) => {
    return <Popup
        title=""
        modalWidth={452}
        show={show}
        onClose={() => {
            onClose();
        }}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="buyModal"
    >
        <div className="cancelWrap">
            <div className="title">
                <Trans>
                    Are your sure you want to cancel your listing？
                </Trans>

            </div>
            <div className="subTitle">
                <Trans>This order may still be filled, if it was previously purchased but not completed on the blockchain.</Trans>
                
            </div>
            <div className="buttons">
                <Button
                    type="default"
                    onClick={() => {
                        onClose();
                    }}
                    block
                >
                    <Trans>Close</Trans>
                </Button>
                <Button
                    type="primary"
                    onClick={() => {
                        handleCancel();
                    }}
                    loading={submiting}
                    block
                >
                   <Trans>Cancel listing</Trans> 
                </Button>
            </div>
        </div>
    </Popup>
}