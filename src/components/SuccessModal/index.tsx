import { Button } from "antd";
import Popup from "../ResponPopup";
import successIcon from "@/assets/status_img_hook.svg";
import './index.less'
export type SuccessProps = {
  show: boolean;
  onClose: () => void;
  onDown: () => void;
  tip: string;
  title?: string;
  children: React.ReactNode;
};

export const DefaultSuccessProps: SuccessProps = {
  show: false,
  onClose: () => {},
  onDown: () => {},
  tip: "",
  title: "",
  children: <></>,
};
export default ({
  show,
  onClose,
  title = "",
  tip,
  children,
  onDown,
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
      {children}
      <Button type="primary" onClick={onDown} size='large'  block>
        Done
      </Button>
    </Popup>
  );
};
