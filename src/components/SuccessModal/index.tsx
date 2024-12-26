import { Button } from "antd";
import Popup from "../ResponPopup";
import successIcon from "@/assets/status_img_hook.svg";
import './index.less'
import SuccessTx from "../SuccessTx";
export type SuccessProps = {
  show: boolean;
  onClose: () => void;
  onDown: () => void;
  tip: string | React.ReactNode;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  okText?: string;
  txs?: {
    label: string;
    txid: string;
  }[];
};

export const DefaultSuccessProps: SuccessProps = {
  show: false,
  onClose: () => { },
  onDown: () => { },
  tip: "",
  title: "",
  children: <></>,
  txs: []
};
export default ({
  show,
  onClose,
  title = "",
  tip,
  children,
  onDown,
  okText = 'Done',
  txs = []
}: SuccessProps) => {
  return (
    <Popup
      title={title}
      modalWidth={452}
      show={show}
      onClose={onClose}
      closable={true}
      bodyStyle={{ padding: "28px 25px" }}
      className="succModal"
    >
      <img src={successIcon} alt="" className="successIcon" />
      <div className="tip">{tip}</div>
      <div className="txs">
        <SuccessTx txs={txs} />
      </div>

      {children}
      <Button type="primary" onClick={onDown} size='large' block>
        {okText}
      </Button>
    </Popup>
  );
};
