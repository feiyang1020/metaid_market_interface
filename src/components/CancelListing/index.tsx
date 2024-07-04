import { Button } from "antd";
import Popup from "../ResponPopup";
import './index.less'
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
                Are your sure you want to cancel your listing？
            </div>
            <div className="subTitle">
                This order may still be filled, if it was previously purchased but
                not completed on the blockchain.
            </div>
            <div className="buttons">
                <Button
                    type="default"
                    onClick={() => {
                        onClose();
                    }}
                    block
                >
                    Close
                </Button>
                <Button
                    type="primary"
                    onClick={() => {
                        handleCancel();
                    }}
                    loading={submiting}
                    block
                >
                    Cancel listing
                </Button>
            </div>
        </div>
    </Popup>
}